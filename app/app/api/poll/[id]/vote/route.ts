import { NextRequest, NextResponse } from "next/server";
import * as anchor from "@coral-xyz/anchor";
import { Connection, PublicKey, SystemProgram } from "@solana/web3.js";
import idl from "../../../../idl.json";
import { PROGRAM_ID, RPC_ENDPOINT, voteRecordPda as computeVoteRecordPda } from "../../../../utils/program";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { optionIndex, walletPubkey, pollId } = await req.json();
    const pollKey = new PublicKey(params.id);
    const voterKey = new PublicKey(walletPubkey);

    const connection = new Connection(RPC_ENDPOINT);
    const wallet = {
      publicKey: voterKey,
      signTransaction: async (tx: any) => tx,
      signAllTransactions: async (txs: any[]) => txs,
    };

    const provider = new anchor.AnchorProvider(connection, wallet, {});
    const program = new anchor.Program({ ...idl, address: PROGRAM_ID.toString() } as any as anchor.Idl, provider);

    const voteRecordPda = computeVoteRecordPda(pollKey, voterKey, PROGRAM_ID);

    // Build the transaction but DON'T sign/send
    const tx = await program.methods
      .vote(new anchor.BN(pollId), optionIndex)
      .accounts({
        poll: pollKey,
        voteRecord: voteRecordPda,
        voter: voterKey,
        systemProgram: SystemProgram.programId,
      } as any)
      .transaction();

    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    tx.feePayer = voterKey;

    const serialized = tx.serialize({ requireAllSignatures: false });
    return NextResponse.json({ tx: Buffer.from(serialized).toString("base64") });
  } catch (error) {
    console.error("Error creating vote transaction:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
