"use client";

import { useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import * as anchor from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import idl from "../../idl.json";

const PROGRAM_ID = new PublicKey("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

export default function PollDetails({ params }: { params: { id: string } }) {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [poll, setPoll] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [votingIndex, setVotingIndex] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const pollKey = new PublicKey(params.id);

  const fetchPoll = async () => {
    try {
      const provider = new anchor.AnchorProvider(connection, wallet as any, { preflightCommitment: "processed" });
      const program = new anchor.Program(idl as any, PROGRAM_ID, provider);
      const fetchedPoll = await program.account.poll.fetch(pollKey);
      setPoll(fetchedPoll);
    } catch (err) {
      console.error("Error fetching poll:", err);
      setError("Poll not found.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPoll();
  }, [connection, wallet]);

  const handleVote = async (index: number) => {
    if (!wallet.connected || !wallet.publicKey) {
      setError("Please connect your wallet to vote.");
      return;
    }

    setVotingIndex(index);
    setError("");
    setSuccess("");

    try {
      const provider = new anchor.AnchorProvider(connection, wallet as any, { preflightCommitment: "processed" });
      const program = new anchor.Program(idl as any, PROGRAM_ID, provider);

      const [voteRecordPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("vote"), pollKey.toBuffer(), wallet.publicKey.toBuffer()],
        program.programId
      );

      await program.methods
        .vote(index)
        .accounts({
          poll: pollKey,
          voteRecord: voteRecordPda,
          voter: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      setSuccess("Vote successfully recorded on Solana!");
      await fetchPoll(); // Refresh results
    } catch (err: any) {
      console.error(err);
      if (err.message.includes("already in use") || err.message.includes("0x0")) {
        setError("You have already voted on this poll! Double voting is prevented by the smart contract.");
      } else {
        setError(err.message || "Failed to cast vote.");
      }
    } finally {
      setVotingIndex(null);
    }
  };

  if (loading) {
    return <div className="text-center mt-20 text-gray-400 animate-pulse">Loading poll details...</div>;
  }

  if (!poll) {
    return <div className="text-center mt-20 text-red-400">{error}</div>;
  }

  const totalVotes = poll.votes.reduce((acc: number, val: any) => acc + val.toNumber(), 0);

  return (
    <div className="max-w-2xl mx-auto glass p-8 mt-10 animate-fade-in">
      <h1 className="text-3xl font-bold mb-2">{poll.title}</h1>
      <p className="text-sm text-gray-400 mb-8 truncate">Created by: {poll.author.toString()}</p>

      {error && <div className="p-4 mb-6 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">{error}</div>}
      {success && <div className="p-4 mb-6 bg-green-500/20 border border-green-500/50 rounded-lg text-green-200 text-sm">{success}</div>}

      <div className="space-y-4">
        {poll.options.map((option: string, index: number) => {
          const votes = poll.votes[index].toNumber();
          const percentage = totalVotes === 0 ? 0 : Math.round((votes / totalVotes) * 100);

          return (
            <div key={index} className="relative bg-black/40 border border-white/10 rounded-xl overflow-hidden p-4 flex items-center justify-between group">
              <div 
                className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-purple-500/30 to-pink-500/30 transition-all duration-1000 ease-out"
                style={{ width: `${percentage}%` }}
              />
              <div className="relative z-10 flex-1 flex justify-between pr-4">
                <span className="font-semibold text-lg">{option}</span>
                <span className="text-gray-300 font-mono">{votes} votes ({percentage}%)</span>
              </div>
              <button
                onClick={() => handleVote(index)}
                disabled={votingIndex !== null}
                className="relative z-10 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition text-sm font-semibold disabled:opacity-50"
              >
                {votingIndex === index ? "Voting..." : "Vote"}
              </button>
            </div>
          );
        })}
      </div>
      
      <div className="mt-8 text-center text-sm text-gray-500 border-t border-white/10 pt-4">
        Total votes cast: {totalVotes}
      </div>
    </div>
  );
}
