import { NextRequest, NextResponse } from "next/server";
import * as anchor from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import idl from "../../../../idl.json";
import { PROGRAM_ID, RPC_ENDPOINT } from "../../../../utils/program";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { walletPubkey, pollId } = await req.json();
    const pollKey = new PublicKey(params.id);
    const authorKey = new PublicKey(walletPubkey);

    const connection = new Connection(RPC_ENDPOINT);
    const wallet = {
      publicKey: authorKey,
      signTransaction: async (tx: any) => tx,
      signAllTransactions: async (txs: any[]) => txs,
    };

    const provider = new anchor.AnchorProvider(connection, wallet, {});
    const program = new anchor.Program({ ...idl, address: PROGRAM_ID.toString() } as any as anchor.Idl, provider);

    // Build the transaction but DON'T sign/send
    const tx = await program.methods
      .closePoll(new anchor.BN(pollId))
      .accounts({
        poll: pollKey,
        author: authorKey,
      } as any)
      .transaction();

    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    tx.feePayer = authorKey;

    const serialized = tx.serialize({ requireAllSignatures: false });
    return NextResponse.json({ tx: Buffer.from(serialized).toString("base64") });
  } catch (error) {
    console.error("Error creating close poll transaction:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
