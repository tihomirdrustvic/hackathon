import { NextResponse } from "next/server";
import * as anchor from "@coral-xyz/anchor";
import { Connection } from "@solana/web3.js";
import idl from "../../idl.json";
import { PROGRAM_ID, RPC_ENDPOINT } from "../../utils/program";

const toNumber = (value: any) => {
  if (typeof value === "number") return value;
  if (typeof value === "bigint") return Number(value);
  if (value && typeof value.toNumber === "function") return value.toNumber();
  return 0;
};

export async function GET() {
  try {
    const connection = new Connection(RPC_ENDPOINT);
    const provider = new anchor.AnchorProvider(connection, {} as any, { preflightCommitment: "processed" });
    const program = new anchor.Program({ ...idl, address: PROGRAM_ID.toString() } as any, provider) as any;

    const polls = await program.account.poll.all();
    
    // We need to serialize the result to JSON because public keys and BN are objects
    const serializedPolls = polls.map((poll: any) => ({
      publicKey: poll.publicKey.toString(),
      account: {
        author: poll.account.author.toString(),
        title: poll.account.title,
        options: poll.account.options.map((name: string, index: number) => ({
          name,
          votes: toNumber(poll.account.votes?.[index]),
        })),
        pollId: poll.account.pollId.toNumber(),
        deadline: poll.account.deadline ? poll.account.deadline.toNumber() : null,
        timestamp: poll.account.timestamp.toNumber(),
        totalVotes: toNumber(poll.account.totalVotes),
        isActive: poll.account.isActive
      }
    }));

    return NextResponse.json({ polls: serializedPolls });
  } catch (error) {
    console.error("Error fetching polls from API route:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
