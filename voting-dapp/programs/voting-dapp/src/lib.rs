use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod voting_dapp {
    use super::*;

    /// Creates a new poll with a title, options, optional deadline, and optional whitelist.
    pub fn create_poll(
        ctx: Context<CreatePoll>,
        poll_id: u64,
        title: String,
        options: Vec<String>,
        deadline: Option<i64>,
        whitelist: Option<Vec<Pubkey>>,
    ) -> Result<()> {
        let poll = &mut ctx.accounts.poll;
        let clock = Clock::get()?;

        require!(options.len() >= 2, ErrorCode::TooFewOptions);
        require!(options.len() <= 10, ErrorCode::TooManyOptions);
        require!(title.len() <= 100, ErrorCode::TitleTooLong);

        // If a deadline is provided, ensure it is in the future
        if let Some(dl) = deadline {
            require!(dl > clock.unix_timestamp, ErrorCode::DeadlineInPast);
        }

        poll.poll_id = poll_id;
        poll.author = ctx.accounts.author.key();
        poll.title = title;
        poll.options = options.clone();
        poll.votes = vec![0u64; options.len()];
        poll.timestamp = clock.unix_timestamp;
        poll.is_active = true;
        poll.deadline = deadline;
        poll.whitelist = whitelist.unwrap_or_default();
        poll.total_votes = 0;

        Ok(())
    }

    /// Casts a vote on a poll. Each wallet can only vote once (enforced by PDA).
    /// The vote is permanently recorded and cannot be changed.
    pub fn vote(ctx: Context<CastVote>, _poll_id: u64, option_index: u32) -> Result<()> {
        let poll = &mut ctx.accounts.poll;
        let clock = Clock::get()?;

        // Check that the poll is still active
        require!(poll.is_active, ErrorCode::PollClosed);

        // Check deadline if set
        if let Some(deadline) = poll.deadline {
            require!(clock.unix_timestamp <= deadline, ErrorCode::PollExpired);
        }

        // Validate option index
        require!(
            (option_index as usize) < poll.options.len(),
            ErrorCode::InvalidOption
        );

        // Check whitelist - if whitelist is not empty, voter must be on it
        if !poll.whitelist.is_empty() {
            let voter_key = ctx.accounts.voter.key();
            require!(
                poll.whitelist.contains(&voter_key),
                ErrorCode::NotWhitelisted
            );
        }

        // Increment vote count for the selected option
        poll.votes[option_index as usize] = poll.votes[option_index as usize]
            .checked_add(1)
            .ok_or(ErrorCode::Overflow)?;
        poll.total_votes = poll
            .total_votes
            .checked_add(1)
            .ok_or(ErrorCode::Overflow)?;

        // Record the vote in the PDA account (prevents double voting via init constraint)
        let vote_record = &mut ctx.accounts.vote_record;
        vote_record.voter = ctx.accounts.voter.key();
        vote_record.poll = poll.key();
        vote_record.option_index = option_index;
        vote_record.timestamp = clock.unix_timestamp;

        Ok(())
    }

    /// Closes a poll so no more votes can be cast. Only the author can close it.
    pub fn close_poll(ctx: Context<ClosePoll>, _poll_id: u64) -> Result<()> {
        let poll = &mut ctx.accounts.poll;

        // Only the original author can close the poll
        require!(
            poll.author == ctx.accounts.author.key(),
            ErrorCode::Unauthorized
        );
        require!(poll.is_active, ErrorCode::PollAlreadyClosed);

        poll.is_active = false;
        Ok(())
    }

    /// Returns the results of a poll. This is a read-only instruction that
    /// verifies the poll data is accessible on-chain.
    pub fn get_results(ctx: Context<GetResults>, _poll_id: u64) -> Result<()> {
        let poll = &ctx.accounts.poll;

        // Emit an event with the results for easy off-chain consumption
        emit!(PollResults {
            poll_id: poll.poll_id,
            title: poll.title.clone(),
            options: poll.options.clone(),
            votes: poll.votes.clone(),
            total_votes: poll.total_votes,
            is_active: poll.is_active,
        });

        Ok(())
    }
}

// ─── Account Structures ──────────────────────────────────────────────────────

#[derive(Accounts)]
#[instruction(poll_id: u64, title: String, options: Vec<String>, deadline: Option<i64>, whitelist: Option<Vec<Pubkey>>)]
pub struct CreatePoll<'info> {
    #[account(
        init,
        payer = author,
        space = Poll::space(&options, &whitelist),
        seeds = [b"poll", author.key().as_ref(), &poll_id.to_le_bytes()],
        bump
    )]
    pub poll: Account<'info, Poll>,

    #[account(mut)]
    pub author: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(_poll_id: u64)]
pub struct CastVote<'info> {
    #[account(mut)]
    pub poll: Account<'info, Poll>,

    #[account(
        init,
        payer = voter,
        space = VoteRecord::SPACE,
        seeds = [b"vote", poll.key().as_ref(), voter.key().as_ref()],
        bump
    )]
    pub vote_record: Account<'info, VoteRecord>,

    #[account(mut)]
    pub voter: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(_poll_id: u64)]
pub struct ClosePoll<'info> {
    #[account(mut)]
    pub poll: Account<'info, Poll>,

    #[account(mut)]
    pub author: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(_poll_id: u64)]
pub struct GetResults<'info> {
    pub poll: Account<'info, Poll>,
}

// ─── Data Accounts ───────────────────────────────────────────────────────────

#[account]
pub struct Poll {
    /// Unique ID for this poll
    pub poll_id: u64,
    /// The wallet that created this poll
    pub author: Pubkey,
    /// The question being asked
    pub title: String,
    /// List of voting options
    pub options: Vec<String>,
    /// Vote counts for each option
    pub votes: Vec<u64>,
    /// Total number of votes cast
    pub total_votes: u64,
    /// Unix timestamp when the poll was created
    pub timestamp: i64,
    /// Whether the poll is still accepting votes
    pub is_active: bool,
    /// Optional deadline (unix timestamp) after which voting is closed
    pub deadline: Option<i64>,
    /// Optional whitelist of allowed voters (empty = anyone can vote)
    pub whitelist: Vec<Pubkey>,
}

impl Poll {
    pub fn space(options: &[String], whitelist: &Option<Vec<Pubkey>>) -> usize {
        let wl_len = whitelist.as_ref().map_or(0, |w| w.len());
        8                          // discriminator
        + 8                        // poll_id
        + 32                       // author
        + 4 + 100                  // title (max 100 chars)
        + 4 + (options.len() * (4 + 50))  // options vec (max 50 chars each)
        + 4 + (options.len() * 8)  // votes vec
        + 8                        // total_votes
        + 8                        // timestamp
        + 1                        // is_active
        + 1 + 8                    // deadline (Option<i64>)
        + 4 + (wl_len * 32)       // whitelist vec
        + 128                      // padding for safety
    }
}

#[account]
pub struct VoteRecord {
    /// The wallet address that cast this vote
    pub voter: Pubkey,
    /// The poll this vote belongs to
    pub poll: Pubkey,
    /// The index of the selected option
    pub option_index: u32,
    /// Unix timestamp when the vote was cast
    pub timestamp: i64,
}

impl VoteRecord {
    pub const SPACE: usize = 8  // discriminator
        + 32                    // voter
        + 32                    // poll
        + 4                     // option_index
        + 8;                    // timestamp
}

// ─── Events ──────────────────────────────────────────────────────────────────

#[event]
pub struct PollResults {
    pub poll_id: u64,
    pub title: String,
    pub options: Vec<String>,
    pub votes: Vec<u64>,
    pub total_votes: u64,
    pub is_active: bool,
}

// ─── Error Codes ─────────────────────────────────────────────────────────────

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid option index")]
    InvalidOption,
    #[msg("You must provide at least 2 options")]
    TooFewOptions,
    #[msg("You cannot provide more than 10 options")]
    TooManyOptions,
    #[msg("Title must be 100 characters or fewer")]
    TitleTooLong,
    #[msg("This poll has been closed")]
    PollClosed,
    #[msg("This poll has expired")]
    PollExpired,
    #[msg("The deadline must be in the future")]
    DeadlineInPast,
    #[msg("You are not whitelisted for this poll")]
    NotWhitelisted,
    #[msg("Only the poll author can perform this action")]
    Unauthorized,
    #[msg("This poll has already been closed")]
    PollAlreadyClosed,
    #[msg("Arithmetic overflow")]
    Overflow,
}
