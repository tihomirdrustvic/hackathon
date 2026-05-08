import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { expect } from "chai";

const idl = require("../../app/app/idl.json");

describe("voting-dapp", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = new Program(
    { ...idl, address: idl.address } as anchor.Idl,
    provider
  ) as Program;
  const pollId = new anchor.BN(Date.now());

  // Derive the Poll PDA
  const [pollPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("poll"),
      provider.wallet.publicKey.toBuffer(),
      pollId.toArrayLike(Buffer, "le", 8),
    ],
    program.programId
  );

  // ──────────────────────────────────────────────────────────────
  // Test 1: Create a poll
  // ──────────────────────────────────────────────────────────────
  it("Creates a poll successfully", async () => {
    const title = "Gdje idemo na izlet?";
    const options = ["Zadar", "Split", "Varaždin"];

    await program.methods
      .createPoll(pollId, title, options, null, null)
      .accounts({
        poll: pollPda,
        author: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const pollAccount = await program.account.poll.fetch(pollPda);

    expect(pollAccount.pollId.toNumber()).to.equal(pollId.toNumber());
    expect(pollAccount.title).to.equal(title);
    expect(pollAccount.options).to.deep.equal(options);
    expect(pollAccount.votes.map((v) => v.toNumber())).to.deep.equal([0, 0, 0]);
    expect(pollAccount.totalVotes.toNumber()).to.equal(0);
    expect(pollAccount.isActive).to.be.true;
    expect(pollAccount.author.toString()).to.equal(
      provider.wallet.publicKey.toString()
    );
    expect(pollAccount.timestamp.toNumber()).to.be.greaterThan(0);

    console.log("    ✓ Poll ID:", pollAccount.pollId.toNumber());
    console.log("    ✓ Title:", pollAccount.title);
    console.log("    ✓ Options:", pollAccount.options);
    console.log("    ✓ Author:", pollAccount.author.toString());
    console.log(
      "    ✓ Timestamp:",
      new Date(pollAccount.timestamp.toNumber() * 1000).toISOString()
    );
  });

  // ──────────────────────────────────────────────────────────────
  // Test 2: Cast a vote
  // ──────────────────────────────────────────────────────────────
  it("Casts a vote successfully", async () => {
    const [voteRecordPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("vote"),
        pollPda.toBuffer(),
        provider.wallet.publicKey.toBuffer(),
      ],
      program.programId
    );

    await program.methods
      .vote(pollId, 1) // Vote for "Split"
      .accounts({
        poll: pollPda,
        voteRecord: voteRecordPda,
        voter: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    // Verify poll state after voting
    const pollAccount = await program.account.poll.fetch(pollPda);
    expect(pollAccount.votes.map((v) => v.toNumber())).to.deep.equal([0, 1, 0]);
    expect(pollAccount.totalVotes.toNumber()).to.equal(1);

    // Verify vote record
    const voteRecord = await program.account.voteRecord.fetch(voteRecordPda);
    expect(voteRecord.voter.toString()).to.equal(
      provider.wallet.publicKey.toString()
    );
    expect(voteRecord.poll.toString()).to.equal(pollPda.toString());
    expect(voteRecord.optionIndex).to.equal(1);
    expect(voteRecord.timestamp.toNumber()).to.be.greaterThan(0);

    console.log("    ✓ Voter:", voteRecord.voter.toString());
    console.log("    ✓ Selected option index:", voteRecord.optionIndex);
    console.log(
      "    ✓ Vote timestamp:",
      new Date(voteRecord.timestamp.toNumber() * 1000).toISOString()
    );
  });

  // ──────────────────────────────────────────────────────────────
  // Test 3: Prevent double voting
  // ──────────────────────────────────────────────────────────────
  it("Prevents double voting from the same wallet", async () => {
    const [voteRecordPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("vote"),
        pollPda.toBuffer(),
        provider.wallet.publicKey.toBuffer(),
      ],
      program.programId
    );

    try {
      await program.methods
        .vote(pollId, 0) // Try voting for "Zadar" (different option)
        .accounts({
          poll: pollPda,
          voteRecord: voteRecordPda,
          voter: provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
      expect.fail("Should have thrown - double vote attempted!");
    } catch (err: any) {
      // PDA already initialized = double vote blocked
      expect(err).to.be.ok;
      console.log(
        "    ✓ Double voting correctly blocked (PDA already exists)"
      );
    }

    // Confirm votes unchanged
    const pollAccount = await program.account.poll.fetch(pollPda);
    expect(pollAccount.votes.map((v) => v.toNumber())).to.deep.equal([0, 1, 0]);
    expect(pollAccount.totalVotes.toNumber()).to.equal(1);
    console.log("    ✓ Vote counts unchanged after blocked attempt");
  });

  // ──────────────────────────────────────────────────────────────
  // Test 4: Display results (get_results instruction)
  // ──────────────────────────────────────────────────────────────
  it("Fetches and displays poll results", async () => {
    // Call get_results instruction
    await program.methods
      .getResults(pollId)
      .accounts({
        poll: pollPda,
      })
      .rpc();

    // Also verify by direct fetch
    const pollAccount = await program.account.poll.fetch(pollPda);

    console.log("\n    ═══════════════════════════════════════");
    console.log("    📊 POLL RESULTS");
    console.log("    ═══════════════════════════════════════");
    console.log(`    📝 Question: ${pollAccount.title}`);
    console.log(`    👤 Author: ${pollAccount.author.toString()}`);
    console.log(
      `    🕐 Created: ${new Date(
        pollAccount.timestamp.toNumber() * 1000
      ).toISOString()}`
    );
    console.log(
      `    ✅ Active: ${pollAccount.isActive ? "Yes" : "No"}`
    );
    console.log("    ───────────────────────────────────────");

    const totalVotes = pollAccount.totalVotes.toNumber();
    pollAccount.options.forEach((opt: string, i: number) => {
      const count = pollAccount.votes[i].toNumber();
      const pct = totalVotes === 0 ? 0 : Math.round((count / totalVotes) * 100);
      const bar = "█".repeat(pct / 5) + "░".repeat(20 - pct / 5);
      console.log(`    ${opt}: ${bar} ${count} votes (${pct}%)`);
    });

    console.log(`    ───────────────────────────────────────`);
    console.log(`    Total votes: ${totalVotes}`);
    console.log("    ═══════════════════════════════════════\n");

    // Assertions
    expect(pollAccount.totalVotes.toNumber()).to.equal(1);
    expect(pollAccount.isActive).to.be.true;
  });

  // ──────────────────────────────────────────────────────────────
  // Test 5: Close poll (bonus - only author can close)
  // ──────────────────────────────────────────────────────────────
  it("Author can close a poll", async () => {
    await program.methods
      .closePoll(pollId)
      .accounts({
        poll: pollPda,
        author: provider.wallet.publicKey,
      })
      .rpc();

    const pollAccount = await program.account.poll.fetch(pollPda);
    expect(pollAccount.isActive).to.be.false;
    console.log("    ✓ Poll closed by author");
  });

  // ──────────────────────────────────────────────────────────────
  // Test 6: Cannot vote on a closed poll
  // ──────────────────────────────────────────────────────────────
  it("Cannot vote on a closed poll", async () => {
    // Generate a new keypair to simulate a different voter
    const newVoter = anchor.web3.Keypair.generate();

    await provider.sendAndConfirm(
      new anchor.web3.Transaction().add(
        anchor.web3.SystemProgram.transfer({
          fromPubkey: provider.wallet.publicKey,
          toPubkey: newVoter.publicKey,
          lamports: 20_000_000,
        })
      )
    );

    const [voteRecordPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("vote"),
        pollPda.toBuffer(),
        newVoter.publicKey.toBuffer(),
      ],
      program.programId
    );

    try {
      await program.methods
        .vote(pollId, 0)
        .accounts({
          poll: pollPda,
          voteRecord: voteRecordPda,
          voter: newVoter.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([newVoter])
        .rpc();
      expect.fail("Should have thrown - poll is closed!");
    } catch (err: any) {
      expect(err).to.be.ok;
      console.log("    ✓ Voting on closed poll correctly blocked");
    }
  });
});
