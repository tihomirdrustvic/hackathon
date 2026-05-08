"use client";

import { useEffect, useState, useCallback } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import * as anchor from "@coral-xyz/anchor";
import idl from "./idl.json";
import Link from "next/link";
import { PublicKey } from "@solana/web3.js";

const PROGRAM_ID = new PublicKey(
  "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS"
);

export default function Home() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [polls, setPolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchPolls = useCallback(async () => {
    try {
      const provider = new anchor.AnchorProvider(connection, wallet as any, {
        preflightCommitment: "processed",
      });
      const program = new anchor.Program(idl as any, PROGRAM_ID, provider);
      const fetchedPolls = await program.account.poll.all();
      setPolls(fetchedPolls);
      setLastRefresh(new Date());
    } catch (err) {
      console.error("Error fetching polls:", err);
    } finally {
      setLoading(false);
    }
  }, [connection, wallet]);

  useEffect(() => {
    fetchPolls();
  }, [fetchPolls]);

  // ─── Live auto-refresh every 15 seconds (bonus) ─────────
  useEffect(() => {
    const interval = setInterval(() => {
      fetchPolls();
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchPolls]);

  return (
    <div className="animate-fade-in-up space-y-10">
      {/* ─── Hero Section ───────────────────────────────────── */}
      <div className="text-center space-y-5 py-8 sm:py-14">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 mb-4">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Solana Devnet • Aktivno
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
            Decentralizirano
          </span>
          <br />
          <span className="text-white/90">Glasanje</span>
        </h1>

        <p className="text-base sm:text-lg text-slate-400 max-w-xl mx-auto leading-relaxed">
          Kreirajte ankete i glasajte trajno na Solana blockchainu.
          <br className="hidden sm:block" />
          Svaki glas je kriptografski siguran i javno provjerljiv.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Link
            href="/create"
            id="hero-create-poll"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 font-semibold text-sm shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all duration-300"
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            Kreiraj Anketu
          </Link>
          {!wallet.connected && (
            <p className="text-xs text-slate-500 self-center">
              Spoji Phantom wallet za glasanje →
            </p>
          )}
        </div>
      </div>

      {/* ─── Stats Bar ──────────────────────────────────────── */}
      {!loading && polls.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: "Ukupno Anketa",
              value: polls.length,
              icon: "📊",
            },
            {
              label: "Aktivne",
              value: polls.filter((p) => p.account.isActive).length,
              icon: "🟢",
            },
            {
              label: "Ukupno Glasova",
              value: polls.reduce(
                (acc, p) => acc + p.account.totalVotes.toNumber(),
                0
              ),
              icon: "🗳️",
            },
            {
              label: "Zadnje osvježavanje",
              value: lastRefresh.toLocaleTimeString("hr-HR"),
              icon: "🔄",
            },
          ].map((stat, i) => (
            <div
              key={i}
              className="glass p-4 text-center animate-count"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="text-xl mb-1">{stat.icon}</div>
              <div className="text-xl sm:text-2xl font-bold text-white">
                {stat.value}
              </div>
              <div className="text-[11px] text-slate-500 font-medium uppercase tracking-wider mt-1">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Polls List ─────────────────────────────────────── */}
      <div className="glass p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-white/90">
            Ankete
          </h2>
          <button
            onClick={fetchPolls}
            id="refresh-polls"
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

        {loading ? (
          <div className="text-center py-16 space-y-4">
            <div className="inline-block w-10 h-10 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
            <p className="text-sm text-slate-500">
              Učitavanje anketa s Devnet mreže...
            </p>
          </div>
        ) : polls.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <div className="text-5xl mb-4">🗳️</div>
            <p className="text-slate-400 text-lg font-medium">
              Nema pronađenih anketa
            </p>
            <p className="text-sm text-slate-500">
              Budi prvi koji će kreirati anketu na blockchainu!
            </p>
            <Link
              href="/create"
              id="empty-create-poll"
              className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl font-semibold text-sm shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all duration-300"
            >
              Kreiraj Prvu Anketu
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 stagger-children">
            {polls.map((poll) => {
              const totalVotes = poll.account.totalVotes.toNumber();
              const isActive = poll.account.isActive;
              const createdDate = new Date(
                poll.account.timestamp.toNumber() * 1000
              );

              return (
                <Link
                  href={`/poll/${poll.publicKey.toString()}`}
                  key={poll.publicKey.toString()}
                  id={`poll-card-${poll.publicKey.toString().slice(0, 8)}`}
                >
                  <div className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-300 cursor-pointer group hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold text-white/90 group-hover:text-indigo-300 transition-colors duration-300 leading-tight">
                        {poll.account.title}
                      </h3>
                      <span
                        className={`shrink-0 ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isActive
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                            : "bg-red-500/15 text-red-400 border border-red-500/20"
                        }`}
                      >
                        {isActive ? "Aktivna" : "Zatvorena"}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
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
                              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                            />
                          </svg>
                          {poll.account.options.length} opcija
                        </span>
                        <span className="flex items-center gap-1">
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
                              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                          {totalVotes} glasova
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        {createdDate.toLocaleDateString("hr-HR")}
                      </div>

                      <p className="text-[10px] text-slate-600 font-mono truncate">
                        Autor:{" "}
                        {poll.account.author.toString().slice(0, 4)}...
                        {poll.account.author.toString().slice(-4)}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
