import { NextRequest, NextResponse } from "next/server";
import * as anchor from "@coral-xyz/anchor";
import { Connection, PublicKey, SystemProgram } from "@solana/web3.js";
import idl from "../../idl.json";
import { PROGRAM_ID, RPC_ENDPOINT, computePollPda } from "../../utils/program";

export async function POST(req: NextRequest) {
  try {
    const { pollId, title, filteredOptions, deadline, whitelist, walletPubkey } = await req.json();
    const options = Array.isArray(filteredOptions)
      ? filteredOptions.map((option: unknown) => String(option).trim()).filter(Boolean)
      : [];

    if (pollId === undefined || pollId === null || pollId === "") {
      return NextResponse.json({ error: "pollId missing" }, { status: 400 });
    }
    if (typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "title missing" }, { status: 400 });
    }
    if (options.length < 2) {
      return NextResponse.json({ error: "options missing" }, { status: 400 });
    }
    if (typeof walletPubkey !== "string" || !walletPubkey.trim()) {
      return NextResponse.json({ error: "walletPubkey missing" }, { status: 400 });
    }

    const connection = new Connection(RPC_ENDPOINT);
    const authorPublicKey = new PublicKey(walletPubkey);
    const wallet = {
      publicKey: authorPublicKey,
      signTransaction: async (tx: any) => tx,
      signAllTransactions: async (txs: any[]) => txs,
    };

    const provider = new anchor.AnchorProvider(connection, wallet, {});
    const program = new anchor.Program({ ...idl, address: PROGRAM_ID.toString() } as any, provider) as any;

    const pollIdBn = new anchor.BN(pollId);
    const pollPda = computePollPda(authorPublicKey, pollId, PROGRAM_ID);
    const deadlineBn = deadline ? new anchor.BN(deadline) : null;
    const whitelistPubkeys = whitelist && whitelist.length > 0 ? whitelist.map((a: string) => new PublicKey(a)) : null;

    // Build the transaction but DON'T sign/send
    const tx = await program.methods
      .createPoll(
        pollIdBn,
        title.trim(),
        options,
        deadlineBn,
        whitelistPubkeys
      )
      .accounts({
        poll: pollPda,
        author: authorPublicKey,
        systemProgram: SystemProgram.programId,
      } as any)
      .transaction();

    const latestBlockhash = await connection.getLatestBlockhash("confirmed");
    tx.recentBlockhash = latestBlockhash.blockhash;
    tx.feePayer = authorPublicKey;

    const serialized = tx.serialize({ requireAllSignatures: false });
    return NextResponse.json({ 
        tx: Buffer.from(serialized).toString("base64"),
        pollPda: pollPda.toString(),
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
    });
  } catch (error) {
    console.error("Error creating poll transaction:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
