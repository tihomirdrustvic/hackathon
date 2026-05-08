import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { VotingDapp } from "../target/types/voting_dapp";
import { expect } from "chai";

describe("voting-dapp", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.VotingDapp as Program<VotingDapp>;
  const pollKeypair = anchor.web3.Keypair.generate();

  it("Is initialized!", async () => {
    // Add your test here.
    const title = "What is your favorite color?";
    const options = ["Red", "Blue", "Green"];

    await program.methods
      .createPoll(title, options)
      .accounts({
        poll: pollKeypair.publicKey,
        author: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([pollKeypair])
      .rpc();

    const pollAccount = await program.account.poll.fetch(pollKeypair.publicKey);
    expect(pollAccount.title).to.equal(title);
    expect(pollAccount.options).to.deep.equal(options);
    expect(pollAccount.votes.map(v => v.toNumber())).to.deep.equal([0, 0, 0]);
  });

  it("Can vote!", async () => {
    const [voteRecordPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("vote"),
        pollKeypair.publicKey.toBuffer(),
        provider.wallet.publicKey.toBuffer(),
      ],
      program.programId
    );

    await program.methods
      .vote(1) // Vote for 'Blue'
      .accounts({
        poll: pollKeypair.publicKey,
        voteRecord: voteRecordPda,
        voter: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const pollAccount = await program.account.poll.fetch(pollKeypair.publicKey);
    expect(pollAccount.votes.map(v => v.toNumber())).to.deep.equal([0, 1, 0]);
  });

  it("Cannot vote twice!", async () => {
    const [voteRecordPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("vote"),
        pollKeypair.publicKey.toBuffer(),
        provider.wallet.publicKey.toBuffer(),
      ],
      program.programId
    );

    try {
      await program.methods
        .vote(0) // Try voting for 'Red'
        .accounts({
          poll: pollKeypair.publicKey,
          voteRecord: voteRecordPda,
          voter: provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
      expect.fail("The transaction should have failed");
    } catch (err) {
      // Expecting an error because the PDA is already initialized
      expect(err).to.be.ok;
    }
  });
});
