use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod voting_dapp {
    use super::*;

    pub fn create_poll(ctx: Context<CreatePoll>, title: String, options: Vec<String>) -> Result<()> {
        let poll = &mut ctx.accounts.poll;
        poll.author = ctx.accounts.author.key();
        poll.title = title;
        poll.options = options.clone();
        poll.votes = vec![0; options.len()];
        Ok(())
    }

    pub fn vote(ctx: Context<Vote>, option_index: u32) -> Result<()> {
        let poll = &mut ctx.accounts.poll;
        
        require!(option_index < poll.options.len() as u32, ErrorCode::InvalidOption);
        
        poll.votes[option_index as usize] = poll.votes[option_index as usize].checked_add(1).unwrap();
        
        let vote_record = &mut ctx.accounts.vote_record;
        vote_record.voter = ctx.accounts.voter.key();
        vote_record.poll = poll.key();
        
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(title: String, options: Vec<String>)]
pub struct CreatePoll<'info> {
    #[account(
        init,
        payer = author,
        space = 8 + 32 + 4 + 100 + 4 + (10 * (4 + 50)) + 4 + (10 * 8) // max ~10 options
    )]
    pub poll: Account<'info, Poll>,
    
    #[account(mut)]
    pub author: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Vote<'info> {
    #[account(mut)]
    pub poll: Account<'info, Poll>,
    
    #[account(
        init,
        payer = voter,
        space = 8 + 32 + 32,
        seeds = [b"vote", poll.key().as_ref(), voter.key().as_ref()],
        bump
    )]
    pub vote_record: Account<'info, VoteRecord>,
    
    #[account(mut)]
    pub voter: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[account]
pub struct Poll {
    pub author: Pubkey,
    pub title: String,
    pub options: Vec<String>,
    pub votes: Vec<u64>,
}

#[account]
pub struct VoteRecord {
    pub voter: Pubkey,
    pub poll: Pubkey,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid option index")]
    InvalidOption,
}
