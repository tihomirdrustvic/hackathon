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

  // Live auto-refresh every 15 seconds (bonus)
  useEffect(() => {
    const interval = setInterval(fetchPolls, 15000);
    return () => clearInterval(interval);
  }, [fetchPolls]);

  const totalVotes = polls.reduce(
    (acc, p) => acc + p.account.totalVotes.toNumber(),
    0
  );

  return (
    <div className="animate-fade-up">
      {/* ─── Hero ───────────────────────────────────────────── */}
      <section className="text-center py-16 sm:py-24">
        <div className="section-tag mb-10" style={{ animation: "fadeUp 1s 0.3s ease both" }}>
          <span
            className="w-2 h-2 rounded-full flex-shrink-0 animate-pulse-green"
            style={{ background: "rgba(244, 63, 94, 0.8)" }}
          />
          <span>LIBROS Hackathon 2026</span>
        </div>

        <h1
          className="font-display font-extrabold leading-none mb-7"
          style={{
            fontSize: "clamp(48px, 7vw, 88px)",
            letterSpacing: "-0.03em",
            animation: "fadeUp 1s 0.5s ease both",
          }}
        >
          <span className="text-gradient-white block">Glasaj Bez</span>
          <span className="text-gradient block">Kompromisa</span>
        </h1>

        <p
          className="max-w-[520px] mx-auto mb-12 leading-relaxed"
          style={{
            fontSize: "clamp(15px, 2vw, 19px)",
            color: "rgba(255,255,255,0.4)",
            fontWeight: 300,
            letterSpacing: "0.02em",
            animation: "fadeUp 1s 0.7s ease both",
          }}
        >
          Decentralizirano glasanje na Solana blockchainu — svaki glas je
          trajan, provjerljiv i zaštićen kriptografijom.
        </p>

        <div
          className="flex items-center justify-center gap-4 flex-wrap"
          style={{ animation: "fadeUp 1s 0.9s ease both" }}
        >
          <Link href="/create" id="hero-create-poll">
            <button className="btn-primary text-base px-8 py-3.5">
              Kreiraj Anketu
            </button>
          </Link>
          <Link href="#polls" id="hero-view-polls">
            <button className="btn-ghost text-base px-8 py-3.5">
              <span>▶</span> Pregledaj Ankete
            </button>
          </Link>
        </div>

        {/* Hero Stats */}
        <div
          className="flex items-center justify-center gap-12 sm:gap-16 mt-20 pt-14 flex-wrap"
          style={{
            borderTop: "1px solid rgba(255,255,255,0.08)",
            animation: "fadeUp 1s 1.1s ease both",
          }}
        >
          {[
            { num: "100%", label: "Nepromjenjivo" },
            { num: "<1s", label: "Solana Finality" },
            { num: `${polls.length}`, label: "Aktivnih Anketa" },
            { num: `${totalVotes}`, label: "Ukupno Glasova" },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div
                className="font-display font-extrabold text-gradient-white"
                style={{
                  fontSize: "36px",
                  letterSpacing: "-0.02em",
                }}
              >
                {stat.num}
              </div>
              <div
                className="mt-1"
                style={{
                  fontSize: "13px",
                  color: "rgba(255,255,255,0.4)",
                  letterSpacing: "0.04em",
                }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Features Grid ──────────────────────────────────── */}
      <section className="py-16">
        <div className="text-center mb-16">
          <div className="section-tag mb-6">✦ Značajke</div>
          <h2
            className="font-display font-extrabold"
            style={{
              fontSize: "clamp(32px, 4vw, 48px)",
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
            }}
          >
            Izgrađeno za <span className="text-gradient">povjerenje</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 stagger">
          {[
            {
              icon: "🔐",
              color: "rgba(99, 102, 241, 0.15)",
              title: "Wallet Identitet",
              desc: "Svaki glasač se autentificira putem Phantom walleta. Nema računa, nema lozinki — samo kriptografski potvrđen identitet.",
            },
            {
              icon: "🚫",
              color: "rgba(244, 63, 94, 0.15)",
              title: "Nema Duplog Glasanja",
              desc: "PDA računi na Solani osiguravaju jedan glas po walletu. Blockchain — ne mi — sprječava duplicirane glasove.",
            },
            {
              icon: "📡",
              color: "rgba(139, 92, 246, 0.15)",
              title: "On-Chain Pohrana",
              desc: "Ankete, opcije, glasovi i wallet adrese pohranjeni su na Solana Devnetu — bez privatnog servera.",
            },
            {
              icon: "⚡",
              color: "rgba(245, 158, 11, 0.15)",
              title: "Sub-sekundna Finalnost",
              desc: "Solana obrađuje tisuće transakcija u sekundi. Vaš glas je potvrđen i nepromjenjiv za manje od sekunde.",
            },
            {
              icon: "🔍",
              color: "rgba(6, 182, 212, 0.15)",
              title: "Javna Provjerljivost",
              desc: "Svatko može neovisno verificirati svaki glas na Solana Exploreru. Potpuna transparentnost.",
            },
            {
              icon: "🛡️",
              color: "rgba(34, 197, 94, 0.15)",
              title: "Admin-Proof",
              desc: "Smart contract provodi pravila. Jednom dani glas ni kreator ankete ne može promijeniti ili ukloniti.",
            },
          ].map((feat, i) => (
            <div key={i} className="card p-8">
              <div
                className="w-[52px] h-[52px] rounded-[14px] flex items-center justify-center mb-6 text-2xl"
                style={{ background: feat.color }}
              >
                {feat.icon}
              </div>
              <h3
                className="font-display font-bold mb-3"
                style={{ fontSize: "18px", letterSpacing: "-0.01em" }}
              >
                {feat.title}
              </h3>
              <p
                className="leading-relaxed"
                style={{ fontSize: "15px", color: "rgba(255,255,255,0.4)" }}
              >
                {feat.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Active Polls ───────────────────────────────────── */}
      <section className="py-16" id="polls">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="section-tag mb-4">✦ Ankete</div>
            <h2
              className="font-display font-extrabold"
              style={{
                fontSize: "clamp(28px, 3vw, 40px)",
                letterSpacing: "-0.02em",
              }}
            >
              Aktivne <span className="text-gradient">ankete</span>
            </h2>
          </div>
          <button
            onClick={fetchPolls}
            id="refresh-polls"
            className="btn-ghost text-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Osvježi
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div
              className="inline-block w-10 h-10 rounded-full animate-spin"
              style={{
                border: "2px solid rgba(99,102,241,0.2)",
                borderTopColor: "var(--indigo)",
              }}
            />
            <p className="mt-4" style={{ fontSize: "14px", color: "rgba(255,255,255,0.4)" }}>
              Učitavanje anketa s Devnet mreže...
            </p>
          </div>
        ) : polls.length === 0 ? (
          <div className="glass p-16 text-center">
            <div className="text-5xl mb-6">🗳️</div>
            <p
              className="font-display font-bold text-xl mb-3"
              style={{ color: "rgba(255,255,255,0.8)" }}
            >
              Nema pronađenih anketa
            </p>
            <p className="mb-8" style={{ fontSize: "15px", color: "rgba(255,255,255,0.4)" }}>
              Budi prvi koji će kreirati anketu na blockchainu!
            </p>
            <Link href="/create" id="empty-create-poll">
              <button className="btn-primary px-8 py-3.5">
                Kreiraj Prvu Anketu
              </button>
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 stagger">
              {polls.map((poll) => {
                const votes = poll.account.totalVotes.toNumber();
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
                    <div className="card p-7 cursor-pointer group">
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <h3
                          className="font-display font-bold group-hover:text-white transition-colors"
                          style={{
                            fontSize: "18px",
                            color: "rgba(255,255,255,0.9)",
                            letterSpacing: "-0.01em",
                          }}
                        >
                          {poll.account.title}
                        </h3>
                        <span
                          className="shrink-0 text-[11px] font-display font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                          style={{
                            background: isActive
                              ? "rgba(34, 197, 94, 0.15)"
                              : "rgba(244, 63, 94, 0.15)",
                            color: isActive
                              ? "var(--green)"
                              : "var(--rose)",
                            border: `1px solid ${
                              isActive
                                ? "rgba(34, 197, 94, 0.2)"
                                : "rgba(244, 63, 94, 0.2)"
                            }`,
                          }}
                        >
                          {isActive ? "Aktivna" : "Zatvorena"}
                        </span>
                      </div>

                      <div
                        className="flex items-center gap-5 mb-3"
                        style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)" }}
                      >
                        <span>{poll.account.options.length} opcija</span>
                        <span>
                          {votes} {votes === 1 ? "glas" : "glasova"}
                        </span>
                        <span>
                          {createdDate.toLocaleDateString("hr-HR")}
                        </span>
                      </div>

                      <div
                        className="font-mono truncate"
                        style={{
                          fontSize: "11px",
                          color: "rgba(255,255,255,0.25)",
                        }}
                      >
                        Autor: {poll.account.author.toString()}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            <div
              className="text-center mt-6"
              style={{ fontSize: "12px", color: "rgba(255,255,255,0.25)" }}
            >
              Zadnje osvježavanje: {lastRefresh.toLocaleTimeString("hr-HR")} · Auto-refresh svakih 15s
            </div>
          </>
        )}
      </section>
    </div>
  );
}
