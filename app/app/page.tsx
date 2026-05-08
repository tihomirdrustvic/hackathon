"use client";

import { useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import * as anchor from "@coral-xyz/anchor";
import idl from "./idl.json";
import Link from "next/link";
import { PublicKey } from "@solana/web3.js";

const PROGRAM_ID = new PublicKey("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

export default function Home() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [polls, setPolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPolls() {
      try {
        const provider = new anchor.AnchorProvider(connection, wallet as any, { preflightCommitment: "processed" });
        const program = new anchor.Program(idl as any, PROGRAM_ID, provider);
        const fetchedPolls = await program.account.poll.all();
        setPolls(fetchedPolls);
      } catch (err) {
        console.error("Error fetching polls:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchPolls();
  }, [connection, wallet]);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center space-y-4 py-12">
        <h1 className="text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
          Decentralized Voting
        </h1>
        <p className="text-lg text-gray-300">
          Create polls and vote permanently on the Solana blockchain.
        </p>
      </div>

      <div className="glass p-8 space-y-6">
        <h2 className="text-2xl font-bold border-b border-white/10 pb-4">Active Polls</h2>
        {loading ? (
          <p className="text-center text-gray-400 animate-pulse">Loading polls from Devnet...</p>
        ) : polls.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400 mb-4">No polls found.</p>
            <Link href="/create" className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold hover:opacity-90 transition">
              Create the first Poll
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {polls.map((poll) => (
              <Link href={`/poll/${poll.publicKey.toString()}`} key={poll.publicKey.toString()}>
                <div className="p-6 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition cursor-pointer group">
                  <h3 className="text-xl font-semibold mb-2 group-hover:text-pink-400 transition">{poll.account.title}</h3>
                  <p className="text-sm text-gray-400">Options: {poll.account.options.length}</p>
                  <p className="text-sm text-gray-400 truncate mt-2 text-xs">Author: {poll.account.author.toString()}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
