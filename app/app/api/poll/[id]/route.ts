import { NextRequest, NextResponse } from "next/server";
import * as anchor from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import idl from "../../../idl.json";
import { PROGRAM_ID, RPC_ENDPOINT } from "../../../utils/program";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const toNumber = (value: any) => {
  if (typeof value === "number") return value;
  if (typeof value === "bigint") return Number(value);
  if (value && typeof value.toNumber === "function") return value.toNumber();
  return 0;
};

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const pollKey = new PublicKey(params.id);
    const connection = new Connection(RPC_ENDPOINT);
    const provider = new anchor.AnchorProvider(connection, {} as any, { preflightCommitment: "processed" });
    const program = new anchor.Program({ ...idl, address: PROGRAM_ID.toString() } as any, provider) as any;

    let fetchedPoll: any = null;
    let fetchError: unknown = null;

    for (let attempt = 0; attempt < 8; attempt += 1) {
      try {
        fetchedPoll = await program.account.poll.fetch(pollKey);
        fetchError = null;
        break;
      } catch (error) {
        fetchError = error;
        await sleep(350);
      }
    }

    if (!fetchedPoll) {
      throw fetchError;
    }

    // Fetch all vote records to get voter wallet addresses
    const allVoteRecords: any[] = await program.account.voteRecord.all([
      {
        memcmp: {
          offset: 8 + 32, // Discriminator + Poll Pubkey
          bytes: pollKey.toBase58(),
        },
      },
    ]);

    const voterList = allVoteRecords.map((record: any) => ({
      voter: record.account.voter.toString(),
      optionIndex: record.account.optionIndex,
      timestamp: record.account.timestamp.toNumber(),
    }));

    // Serialize poll properly
    const serializedPoll = {
        title: fetchedPoll.title,
        options: fetchedPoll.options,
        votes: fetchedPoll.options.map((_: string, index: number) => toNumber(fetchedPoll.votes?.[index])),
        totalVotes: toNumber(fetchedPoll.totalVotes),
        author: fetchedPoll.author.toString(),
        timestamp: fetchedPoll.timestamp.toNumber(),
        deadline: fetchedPoll.deadline ? fetchedPoll.deadline.toNumber() : null,
        isActive: fetchedPoll.isActive,
        pollId: fetchedPoll.pollId.toNumber(),
    };

    return NextResponse.json({ poll: serializedPoll, voters: voterList });
  } catch (error) {
    console.error("Error fetching poll details from API:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
