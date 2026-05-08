"use client";

import { useEffect, useState, useCallback } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import * as anchor from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import idl from "../../idl.json";
import Link from "next/link";

const PROGRAM_ID = new PublicKey(
  "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS"
);

interface VoterInfo {
  voter: string;
  optionIndex: number;
  timestamp: number;
}

export default function PollDetails({ params }: { params: { id: string } }) {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [poll, setPoll] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [votingIndex, setVotingIndex] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [voters, setVoters] = useState<VoterInfo[]>([]);
  const [showVoters, setShowVoters] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const pollKey = new PublicKey(params.id);

  const fetchPollData = useCallback(async () => {
    try {
      const provider = new anchor.AnchorProvider(connection, wallet as any, {
        preflightCommitment: "processed",
      });
      const program = new anchor.Program(idl as any, PROGRAM_ID, provider);

      // Fetch poll
      const fetchedPoll = await program.account.poll.fetch(pollKey);
      setPoll(fetchedPoll);

      // Fetch all vote records for this poll to get voter wallet addresses
      const allVoteRecords = await program.account.voteRecord.all([
        {
          memcmp: {
            offset: 8 + 32, // after discriminator + voter pubkey
            bytes: pollKey.toBase58(),
          },
        },
      ]);

      const voterList: VoterInfo[] = allVoteRecords.map((record) => ({
        voter: record.account.voter.toString(),
        optionIndex: record.account.optionIndex,
        timestamp: record.account.timestamp.toNumber(),
      }));

      setVoters(voterList);
      setLastRefresh(new Date());
    } catch (err) {
      console.error("Error fetching poll:", err);
      setError("Anketa nije pronađena.");
    } finally {
      setLoading(false);
    }
  }, [connection, wallet, pollKey.toString()]);

  useEffect(() => {
    fetchPollData();
  }, [fetchPollData]);

  // ─── Live auto-refresh every 10 seconds (bonus) ─────────
  useEffect(() => {
    const interval = setInterval(() => {
      fetchPollData();
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchPollData]);

  const handleVote = async (index: number) => {
    if (!wallet.connected || !wallet.publicKey) {
      setError("Molimo spojite Phantom wallet za glasanje.");
      return;
    }

    setVotingIndex(index);
    setError("");
    setSuccess("");

    try {
      const provider = new anchor.AnchorProvider(connection, wallet as any, {
        preflightCommitment: "processed",
      });
      const program = new anchor.Program(idl as any, PROGRAM_ID, provider);

      const [voteRecordPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("vote"),
          pollKey.toBuffer(),
          wallet.publicKey.toBuffer(),
        ],
        program.programId
      );

      await program.methods
        .vote(new anchor.BN(poll.pollId.toNumber()), index)
        .accounts({
          poll: pollKey,
          voteRecord: voteRecordPda,
          voter: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      setSuccess("✅ Glas uspješno zapisan na Solana blockchain!");
      await fetchPollData();
    } catch (err: any) {
      console.error(err);
      if (
        err.message?.includes("already in use") ||
        err.message?.includes("0x0")
      ) {
        setError(
          "⚠️ Već ste glasali na ovoj anketi! Duplo glasanje je spriječeno putem smart contracta."
        );
      } else if (err.message?.includes("PollClosed") || err.message?.includes("6004")) {
        setError("Ova anketa je zatvorena. Glasanje više nije moguće.");
      } else if (err.message?.includes("PollExpired") || err.message?.includes("6005")) {
        setError("Rok za glasanje je istekao.");
      } else if (err.message?.includes("NotWhitelisted") || err.message?.includes("6007")) {
        setError("Vaš wallet nije na listi dopuštenih glasača.");
      } else {
        setError(err.message || "Greška pri glasanju.");
      }
    } finally {
      setVotingIndex(null);
    }
  };

  const handleClosePoll = async () => {
    if (!wallet.connected || !wallet.publicKey) return;

    try {
      const provider = new anchor.AnchorProvider(connection, wallet as any, {
        preflightCommitment: "processed",
      });
      const program = new anchor.Program(idl as any, PROGRAM_ID, provider);

      await program.methods
        .closePoll(new anchor.BN(poll.pollId.toNumber()))
        .accounts({
          poll: pollKey,
          author: wallet.publicKey,
        })
        .rpc();

      setSuccess("Anketa je zatvorena.");
      await fetchPollData();
    } catch (err: any) {
      console.error(err);
      setError("Samo autor ankete može zatvoriti glasanje.");
    }
  };

  // ─── Loading State ───────────────────────────────────────
  if (loading) {
    return (
      <div className="text-center mt-20 space-y-4 animate-fade-in">
        <div className="inline-block w-12 h-12 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-sm text-slate-500">
          Učitavanje podataka s blockchaina...
        </p>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="text-center mt-20 space-y-4 animate-fade-in">
        <div className="text-5xl">❌</div>
        <p className="text-red-400 text-lg font-medium">{error}</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          ← Natrag na početnu
        </Link>
      </div>
    );
  }

  const totalVotes = poll.totalVotes.toNumber();
  const isAuthor =
    wallet.publicKey?.toString() === poll.author.toString();
  const createdDate = new Date(poll.timestamp.toNumber() * 1000);
  const hasDeadline = poll.deadline !== null && poll.deadline !== undefined;
  const deadlineDate = hasDeadline
    ? new Date(poll.deadline.toNumber() * 1000)
    : null;
  const isExpired =
    hasDeadline && deadlineDate && deadlineDate.getTime() < Date.now();

  return (
    <div className="max-w-3xl mx-auto animate-fade-in-up">
      {/* ─── Back Link ──────────────────────────────────────── */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 transition-colors mb-6"
        id="back-to-home"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          />
        </svg>
        Sve Ankete
      </Link>

      {/* ─── Poll Header ───────────────────────────────────── */}
      <div className="glass p-6 sm:p-8 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-black text-white/95 leading-tight mb-3">
              {poll.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span
                className={`px-2.5 py-1 rounded-full font-bold uppercase tracking-wider text-[10px] ${
                  poll.isActive && !isExpired
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                    : "bg-red-500/15 text-red-400 border border-red-500/20"
                }`}
              >
                {poll.isActive && !isExpired ? "🟢 Aktivna" : "🔴 Zatvorena"}
              </span>
              <span>
                Kreirano: {createdDate.toLocaleDateString("hr-HR")}{" "}
                {createdDate.toLocaleTimeString("hr-HR")}
              </span>
              {hasDeadline && deadlineDate && (
                <span className={isExpired ? "text-red-400" : "text-amber-400"}>
                  ⏰ Rok:{" "}
                  {deadlineDate.toLocaleDateString("hr-HR")}{" "}
                  {deadlineDate.toLocaleTimeString("hr-HR")}
                </span>
              )}
            </div>
          </div>

          {/* Close poll button (author only) */}
          {isAuthor && poll.isActive && !isExpired && (
            <button
              onClick={handleClosePoll}
              id="close-poll"
              className="shrink-0 px-4 py-2 text-xs font-semibold rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all duration-300"
            >
              Zatvori Glasanje
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-600 font-mono">
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          Autor: {poll.author.toString()}
        </div>
      </div>

      {/* ─── Alerts ─────────────────────────────────────────── */}
      {error && (
        <div
          className="flex items-start gap-3 p-4 mb-6 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm animate-fade-in"
          id="vote-error"
        >
          <svg
            className="w-5 h-5 shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {error}
        </div>
      )}
      {success && (
        <div
          className="flex items-start gap-3 p-4 mb-6 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm animate-fade-in"
          id="vote-success"
        >
          <svg
            className="w-5 h-5 shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {success}
        </div>
      )}

      {/* ─── Voting Options ─────────────────────────────────── */}
      <div className="glass p-6 sm:p-8 mb-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white/90">Opcije za glasanje</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchPollData}
              id="refresh-results"
              className="text-xs font-medium px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] transition-all duration-300 text-slate-400 hover:text-white flex items-center gap-1.5"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Osvježi
            </button>
          </div>
        </div>

        <div className="space-y-3 stagger-children">
          {poll.options.map((option: string, index: number) => {
            const votes = poll.votes[index].toNumber();
            const percentage =
              totalVotes === 0 ? 0 : Math.round((votes / totalVotes) * 100);
            const canVote = poll.isActive && !isExpired;

            // Color gradient based on ranking
            const colors = [
              "from-indigo-500/40 to-purple-500/40",
              "from-purple-500/40 to-pink-500/40",
              "from-pink-500/40 to-rose-500/40",
              "from-blue-500/40 to-indigo-500/40",
              "from-teal-500/40 to-emerald-500/40",
              "from-amber-500/40 to-orange-500/40",
              "from-cyan-500/40 to-blue-500/40",
              "from-fuchsia-500/40 to-pink-500/40",
              "from-lime-500/40 to-green-500/40",
              "from-violet-500/40 to-purple-500/40",
            ];

            return (
              <div
                key={index}
                id={`vote-option-${index}`}
                className="relative bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden group hover:border-white/[0.12] transition-all duration-300"
              >
                {/* Progress bar */}
                <div
                  className={`absolute left-0 top-0 bottom-0 bg-gradient-to-r ${colors[index % colors.length]} transition-all duration-1000 ease-out`}
                  style={{ width: `${percentage}%` }}
                />

                <div className="relative z-10 p-4 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="text-base font-semibold text-white/90 truncate">
                        {option}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-slate-400 font-mono">
                        {votes} {votes === 1 ? "glas" : "glasova"}
                      </span>
                      <span className="text-xs font-bold text-white/70">
                        {percentage}%
                      </span>
                    </div>
                  </div>

                  {canVote && (
                    <button
                      onClick={() => handleVote(index)}
                      disabled={votingIndex !== null}
                      id={`vote-btn-${index}`}
                      className="shrink-0 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg text-sm font-semibold shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-40 disabled:hover:translate-y-0"
                    >
                      {votingIndex === index ? (
                        <span className="flex items-center gap-1.5">
                          <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Glasam...
                        </span>
                      ) : (
                        "Glasaj"
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ─── Total Votes ────────────────────────────────── */}
        <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between">
          <div className="text-sm text-slate-400">
            Ukupno glasova:{" "}
            <span className="text-white font-bold text-lg animate-count">
              {totalVotes}
            </span>
          </div>
          <div className="text-[11px] text-slate-600">
            Zadnje osvježavanje: {lastRefresh.toLocaleTimeString("hr-HR")}
          </div>
        </div>
      </div>

      {/* ─── Voter Addresses (REQUIRED by prompt) ──────────── */}
      <div className="glass p-6 sm:p-8 mb-6">
        <button
          onClick={() => setShowVoters(!showVoters)}
          id="toggle-voters"
          className="w-full flex items-center justify-between"
        >
          <h2 className="text-lg font-bold text-white/90 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-indigo-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            Wallet Adrese Glasača ({voters.length})
          </h2>
          <svg
            className={`w-5 h-5 text-slate-500 transition-transform duration-300 ${
              showVoters ? "rotate-180" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {showVoters && (
          <div className="mt-5 space-y-2 animate-fade-in">
            {voters.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">
                Još nitko nije glasao na ovoj anketi.
              </p>
            ) : (
              <>
                {/* Table header */}
                <div className="grid grid-cols-12 gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  <div className="col-span-5">Wallet Adresa</div>
                  <div className="col-span-4">Glasao Za</div>
                  <div className="col-span-3">Vrijeme</div>
                </div>

                {voters.map((voter, i) => (
                  <div
                    key={i}
                    id={`voter-${i}`}
                    className="grid grid-cols-12 gap-2 px-3 py-3 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-colors text-sm stagger-children"
                  >
                    <div className="col-span-5 font-mono text-xs text-indigo-300 truncate">
                      {voter.voter}
                    </div>
                    <div className="col-span-4 text-xs text-slate-300">
                      <span className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.06]">
                        {poll.options[voter.optionIndex] || `Option ${voter.optionIndex}`}
                      </span>
                    </div>
                    <div className="col-span-3 text-xs text-slate-500">
                      {new Date(voter.timestamp * 1000).toLocaleString(
                        "hr-HR",
                        {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* ─── Blockchain Info ────────────────────────────────── */}
      <div className="glass p-5 text-xs text-slate-600 space-y-1.5">
        <p className="font-semibold text-slate-500 mb-2 uppercase tracking-wider text-[10px]">
          Blockchain Podaci
        </p>
        <p>
          <span className="text-slate-500">Poll Account:</span>{" "}
          <span className="font-mono text-indigo-400/70">{params.id}</span>
        </p>
        <p>
          <span className="text-slate-500">Program ID:</span>{" "}
          <span className="font-mono text-indigo-400/70">
            {PROGRAM_ID.toString()}
          </span>
        </p>
        <p>
          <span className="text-slate-500">Mreža:</span>{" "}
          <span className="text-emerald-400">Solana Devnet</span>
        </p>
        <p>
          <span className="text-slate-500">Poll ID:</span>{" "}
          <span className="font-mono">{poll.pollId.toNumber()}</span>
        </p>
      </div>
    </div>
  );
}
