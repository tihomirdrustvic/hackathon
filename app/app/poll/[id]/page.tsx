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

const BAR_COLORS = [
  "option-bar-indigo",
  "option-bar-rose",
  "option-bar-violet",
  "option-bar-amber",
  "option-bar-cyan",
  "option-bar-green",
  "option-bar-indigo",
  "option-bar-rose",
  "option-bar-violet",
  "option-bar-amber",
];

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

  const pollKey = new PublicKey(params.id);

  const fetchPollData = useCallback(async () => {
    try {
      const provider = new anchor.AnchorProvider(connection, wallet as any, {
        preflightCommitment: "processed",
      });
      const program = new anchor.Program(idl as any, PROGRAM_ID, provider);

      const fetchedPoll = await program.account.poll.fetch(pollKey);
      setPoll(fetchedPoll);

      // Fetch all vote records to get voter wallet addresses
      const allVoteRecords = await program.account.voteRecord.all([
        {
          memcmp: {
            offset: 8 + 32,
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

  // Live auto-refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(fetchPollData, 10000);
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
        [Buffer.from("vote"), pollKey.toBuffer(), wallet.publicKey.toBuffer()],
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

      setSuccess("Glas uspješno zapisan na Solana blockchain!");
      await fetchPollData();
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes("already in use") || err.message?.includes("0x0")) {
        setError("Već ste glasali na ovoj anketi! Duplo glasanje spriječeno putem smart contracta.");
      } else if (err.message?.includes("PollClosed") || err.message?.includes("6004")) {
        setError("Ova anketa je zatvorena.");
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
        .accounts({ poll: pollKey, author: wallet.publicKey })
        .rpc();

      setSuccess("Anketa je zatvorena.");
      await fetchPollData();
    } catch (err: any) {
      setError("Samo autor ankete može zatvoriti glasanje.");
    }
  };

  if (loading) {
    return (
      <div className="text-center py-32 animate-fade-in">
        <div
          className="inline-block w-12 h-12 rounded-full animate-spin"
          style={{ border: "2px solid rgba(99,102,241,0.2)", borderTopColor: "var(--indigo)" }}
        />
        <p className="mt-4" style={{ fontSize: "14px", color: "rgba(255,255,255,0.4)" }}>
          Učitavanje podataka s blockchaina...
        </p>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="text-center py-32 animate-fade-in">
        <div className="text-5xl mb-4">❌</div>
        <p className="font-display font-bold text-xl mb-4" style={{ color: "var(--rose)" }}>
          {error}
        </p>
        <Link href="/" className="btn-ghost">← Natrag na početnu</Link>
      </div>
    );
  }

  const totalVotes = poll.totalVotes.toNumber();
  const isAuthor = wallet.publicKey?.toString() === poll.author.toString();
  const createdDate = new Date(poll.timestamp.toNumber() * 1000);
  const hasDeadline = poll.deadline !== null && poll.deadline !== undefined;
  const deadlineDate = hasDeadline ? new Date(poll.deadline.toNumber() * 1000) : null;
  const isExpired = hasDeadline && deadlineDate && deadlineDate.getTime() < Date.now();
  const canVote = poll.isActive && !isExpired;

  return (
    <div className="max-w-3xl mx-auto animate-fade-up">
      {/* Back */}
      <Link
        href="/"
        id="back-to-home"
        className="inline-flex items-center gap-2 mb-8 font-display text-sm font-medium transition-colors duration-200"
        style={{ color: "rgba(255,255,255,0.4)" }}
      >
        ← Sve Ankete
      </Link>

      {/* ─── Poll Card (matching mock-card style) ──────────── */}
      <div className="glass p-8 sm:p-10 mb-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
              Glasanje u tijeku
            </span>
          </div>
          <div
            className="flex items-center gap-1.5 text-xs font-medium"
            style={{ color: canVote ? "var(--green)" : "var(--rose)" }}
          >
            <span
              className="w-[7px] h-[7px] rounded-full"
              style={{
                background: canVote ? "var(--green)" : "var(--rose)",
                animation: canVote ? "pulseGreen 1.5s ease-in-out infinite" : "none",
              }}
            />
            {canVote ? "LIVE na Devnet" : "Zatvoreno"}
          </div>
        </div>

        {/* Question */}
        <h1
          className="font-display font-bold mb-6"
          style={{ fontSize: "22px", lineHeight: 1.4 }}
        >
          {poll.title}
        </h1>

        {/* Alerts */}
        {error && (
          <div
            className="flex items-start gap-3 p-4 mb-6 rounded-2xl animate-fade-in text-sm"
            style={{
              background: "rgba(244, 63, 94, 0.08)",
              border: "1px solid rgba(244, 63, 94, 0.2)",
              color: "var(--rose-light)",
            }}
            id="vote-error"
          >
            ⚠ {error}
          </div>
        )}
        {success && (
          <div
            className="flex items-start gap-3 p-4 mb-6 rounded-2xl animate-fade-in text-sm"
            style={{
              background: "rgba(34, 197, 94, 0.08)",
              border: "1px solid rgba(34, 197, 94, 0.2)",
              color: "#86efac",
            }}
            id="vote-success"
          >
            ✓ {success}
          </div>
        )}

        {/* ─── Options (mock-option style) ──────────────────── */}
        <div className="space-y-3 stagger">
          {poll.options.map((option: string, index: number) => {
            const votes = poll.votes[index].toNumber();
            const percentage = totalVotes === 0 ? 0 : Math.round((votes / totalVotes) * 100);

            return (
              <div
                key={index}
                id={`vote-option-${index}`}
                className="relative rounded-xl overflow-hidden cursor-pointer transition-all duration-200"
                style={{
                  border: `1px solid ${votingIndex === index ? "rgba(99,102,241,0.5)" : "rgba(255,255,255,0.08)"}`,
                }}
                onClick={() => canVote && votingIndex === null && handleVote(index)}
              >
                {/* Progress bar */}
                <div
                  className={`absolute left-0 top-0 bottom-0 ${BAR_COLORS[index % BAR_COLORS.length]} rounded-xl`}
                  style={{
                    width: `${percentage}%`,
                    transition: "width 1.5s cubic-bezier(0.23, 0.86, 0.39, 0.96)",
                  }}
                />

                {/* Content */}
                <div className="relative z-10 flex items-center justify-between px-4 py-4">
                  <span className="font-medium" style={{ fontSize: "15px" }}>
                    {option}
                  </span>
                  <div className="flex items-center gap-3">
                    <span
                      className="font-display font-bold text-sm"
                      style={{ color: "rgba(255,255,255,0.6)" }}
                    >
                      {percentage}%
                    </span>
                    {canVote && (
                      <button
                        disabled={votingIndex !== null}
                        id={`vote-btn-${index}`}
                        className="btn-primary text-xs px-4 py-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleVote(index);
                        }}
                      >
                        {votingIndex === index ? (
                          <span className="flex items-center gap-1.5">
                            <span
                              className="w-3 h-3 rounded-full animate-spin"
                              style={{ border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white" }}
                            />
                          </span>
                        ) : (
                          "Glasaj"
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer (matching mock-footer) */}
        <div
          className="flex items-center justify-between mt-6 pt-5 flex-wrap gap-3"
          style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
        >
          <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)" }}>
            📊 {totalVotes} {totalVotes === 1 ? "glas" : "glasova"} ukupno
          </div>
          <div className="flex items-center gap-2" style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>
            <span style={{ fontSize: "16px" }}>◎</span>
            Solana Devnet
          </div>
        </div>

        {/* Wallet Chips (matching claude-frontend) */}
        {voters.length > 0 && (
          <div className="flex gap-2 flex-wrap mt-4">
            {voters.slice(0, 3).map((v, i) => (
              <div key={i} className="wallet-chip">
                {v.voter.slice(0, 4)}...{v.voter.slice(-4)}
              </div>
            ))}
            {voters.length > 3 && (
              <div className="wallet-chip">
                +{voters.length - 3} više
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── Poll Meta ──────────────────────────────────────── */}
      <div className="glass p-7 mb-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          <div>
            <div className="text-[11px] uppercase tracking-wider font-display font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>
              Autor
            </div>
            <div className="font-mono text-xs truncate" style={{ color: "var(--indigo-light)" }}>
              {poll.author.toString()}
            </div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider font-display font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>
              Kreirano
            </div>
            <div className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
              {createdDate.toLocaleDateString("hr-HR")} {createdDate.toLocaleTimeString("hr-HR")}
            </div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider font-display font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>
              Rok
            </div>
            <div className="text-sm" style={{ color: hasDeadline ? (isExpired ? "var(--rose)" : "var(--amber)") : "rgba(255,255,255,0.4)" }}>
              {hasDeadline && deadlineDate
                ? `${deadlineDate.toLocaleDateString("hr-HR")} ${deadlineDate.toLocaleTimeString("hr-HR")}`
                : "Bez ograničenja"}
            </div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider font-display font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>
              Status
            </div>
            <div className="text-sm" style={{ color: canVote ? "var(--green)" : "var(--rose)" }}>
              {canVote ? "Aktivno" : "Zatvoreno"}
            </div>
          </div>
        </div>

        {isAuthor && poll.isActive && !isExpired && (
          <div className="mt-6 pt-5" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <button onClick={handleClosePoll} id="close-poll" className="btn-ghost text-sm" style={{ borderColor: "rgba(244,63,94,0.3)", color: "var(--rose-light)" }}>
              Zatvori Glasanje
            </button>
          </div>
        )}
      </div>

      {/* ─── Voter Wallet Addresses (REQUIRED) ──────────────── */}
      <div className="glass p-7 mb-8">
        <button
          onClick={() => setShowVoters(!showVoters)}
          id="toggle-voters"
          className="w-full flex items-center justify-between"
        >
          <h2 className="font-display font-bold text-base flex items-center gap-2">
            👥 Wallet Adrese Glasača
            <span
              className="font-display text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: "var(--surface2)", color: "rgba(255,255,255,0.5)" }}
            >
              {voters.length}
            </span>
          </h2>
          <span
            className="text-lg transition-transform duration-300"
            style={{
              color: "rgba(255,255,255,0.4)",
              transform: showVoters ? "rotate(180deg)" : "rotate(0)",
            }}
          >
            ▾
          </span>
        </button>

        {showVoters && (
          <div className="mt-5 space-y-2 animate-fade-in">
            {voters.length === 0 ? (
              <p className="text-center py-6" style={{ fontSize: "14px", color: "rgba(255,255,255,0.3)" }}>
                Još nitko nije glasao na ovoj anketi.
              </p>
            ) : (
              <>
                <div
                  className="grid grid-cols-12 gap-2 px-3 py-2 font-display font-bold uppercase tracking-wider"
                  style={{ fontSize: "10px", color: "rgba(255,255,255,0.25)" }}
                >
                  <div className="col-span-5">Wallet Adresa</div>
                  <div className="col-span-4">Glasao Za</div>
                  <div className="col-span-3">Vrijeme</div>
                </div>

                {voters.map((voter, i) => (
                  <div
                    key={i}
                    id={`voter-${i}`}
                    className="grid grid-cols-12 gap-2 px-3 py-3 rounded-xl transition-colors duration-200"
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.04)",
                    }}
                  >
                    <div className="col-span-5 font-mono text-xs truncate" style={{ color: "var(--indigo-light)" }}>
                      {voter.voter}
                    </div>
                    <div className="col-span-4">
                      <span
                        className="text-xs px-2 py-0.5 rounded-md"
                        style={{
                          background: "var(--surface)",
                          border: "1px solid rgba(255,255,255,0.06)",
                          color: "rgba(255,255,255,0.6)",
                        }}
                      >
                        {poll.options[voter.optionIndex] || `Option ${voter.optionIndex}`}
                      </span>
                    </div>
                    <div className="col-span-3 text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
                      {new Date(voter.timestamp * 1000).toLocaleString("hr-HR", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* ─── Blockchain Info ────────────────────────────────── */}
      <div
        className="rounded-2xl p-5 space-y-2"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          fontSize: "12px",
          color: "rgba(255,255,255,0.3)",
        }}
      >
        <p className="font-display font-bold text-[10px] uppercase tracking-wider mb-3" style={{ color: "rgba(255,255,255,0.2)" }}>
          Blockchain Podaci
        </p>
        <p>
          <span style={{ color: "rgba(255,255,255,0.4)" }}>Poll Account:</span>{" "}
          <span className="font-mono" style={{ color: "var(--indigo-light)", opacity: 0.6 }}>{params.id}</span>
        </p>
        <p>
          <span style={{ color: "rgba(255,255,255,0.4)" }}>Program ID:</span>{" "}
          <span className="font-mono" style={{ color: "var(--indigo-light)", opacity: 0.6 }}>{PROGRAM_ID.toString()}</span>
        </p>
        <p>
          <span style={{ color: "rgba(255,255,255,0.4)" }}>Mreža:</span>{" "}
          <span style={{ color: "var(--green)" }}>Solana Devnet</span>
        </p>
      </div>
    </div>
  );
}
