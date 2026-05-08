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
  const featuredPoll = polls[0];

  return (
    <div className="animate-fade-up">
      <section className="hero -mx-6 -mt-24" id="hero">
        <div className="hero-gradient-bg"></div>
        <div className="hero-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
          <div className="shape shape-4"></div>
          <div className="shape shape-5"></div>
        </div>
        <div className="hero-overlay-top"></div>

        <div className="hero-content pt-24">
          <div className="hero-badge">
            <div className="badge-dot"></div>
            <span>LIBROS Hackathon 2026</span>
          </div>

          <h1 className="hero-title">
            <span className="hero-title-line1">Vote Without</span>
            <span className="hero-title-line2">Compromise</span>
          </h1>

          <p className="hero-sub">
            Decentralizirano glasanje na Solana blockchainu — svaki glas je trajan,
            provjerljiv i zaštićen kriptografijom.
          </p>

          <div className="hero-actions">
            <Link href="/create" id="hero-create-poll" className="btn-hero-primary">
              Create a Poll
            </Link>
            <Link href="#polls" id="hero-view-polls" className="btn-hero-secondary">
              <span>▶</span> Pregledaj ankete
            </Link>
          </div>

          <div className="hero-stats">
            {[
              { num: "100%", label: "Tamper-proof" },
              { num: "<1s", label: "Solana Finality" },
              { num: `${polls.length}`, label: "On-chain polls" },
              { num: `${totalVotes}`, label: "Recorded votes" },
            ].map((stat) => (
              <div key={stat.label} className="stat">
                <div className="stat-num">{stat.num}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="features -mx-6" id="features">
        <div className="container">
          <div className="features-header reveal visible">
            <div className="section-tag">✦ Features</div>
            <h2 className="section-title">Built for <span>trust</span></h2>
            <p className="section-sub">
              Every feature is designed around one principle: your vote belongs to you,
              not to any server or administrator.
            </p>
          </div>

          <div className="features-grid">
            {[
              {
                icon: "🔐",
                color: "indigo",
                title: "Wallet Identity",
                desc: "Svaki glasač se autentificira putem Phantom walleta. Nema računa, nema lozinki — samo kriptografski potvrđen identitet.",
              },
              {
                icon: "🚫",
                color: "rose",
                title: "No Double Voting",
                desc: "PDA računi na Solani osiguravaju jedan glas po walletu. Blockchain sprječava duplicirane glasove.",
              },
              {
                icon: "📡",
                color: "violet",
                title: "On-Chain Storage",
                desc: "Ankete, opcije, glasovi i wallet adrese pohranjeni su na Solana Devnetu — bez privatnog servera.",
              },
              {
                icon: "⚡",
                color: "amber",
                title: "Sub-second Finality",
                desc: "Solana brzo potvrđuje transakcije, a svaki glas ostaje trajno zapisan na blockchainu.",
              },
              {
                icon: "🔍",
                color: "cyan",
                title: "Public Verifiability",
                desc: "Svatko može provjeriti rezultate i wallet adrese glasača direktno iz javnih on-chain podataka.",
              },
              {
                icon: "🛡️",
                color: "green",
                title: "Admin-Proof",
                desc: "Smart contract provodi pravila. Jednom dani glas ni kreator ankete ne može promijeniti ili ukloniti.",
              },
            ].map((feat) => (
              <div key={feat.title} className="feature-card reveal visible">
                <div className={`feature-icon ${feat.color}`}>{feat.icon}</div>
                <div className="feature-title">{feat.title}</div>
                <p className="feature-desc">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="how -mx-6" id="how">
        <div className="container">
          <div className="how-inner">
            <div>
              <div className="section-tag reveal visible">✦ How It Works</div>
              <h2 className="section-title reveal visible">Three steps to <span>immutable</span> democracy</h2>
              <p className="section-sub reveal visible" style={{ marginBottom: "48px" }}>
                Powered by Anchor Framework and Solana blockchain. Built in Rust for maximum security and performance.
              </p>

              <div className="how-steps">
                {[
                  ["01", "Connect your Phantom Wallet", "No registration. Your wallet address is your identity — verified on every action you take."],
                  ["02", "Create or Find a Poll", "Define your question and options. create_poll writes your poll directly to Solana Devnet."],
                  ["03", "Cast your Vote On-Chain", "The vote instruction creates a PDA tied to your wallet, making double voting impossible."],
                  ["04", "Watch Results in Real Time", "Results are read directly from chain, including totals and voter wallet addresses."],
                ].map(([num, title, desc]) => (
                  <div key={num} className="step visible">
                    <div className="step-num">{num}</div>
                    <div className="step-content">
                      <h3>{title}</h3>
                      <p>{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="how-visual reveal visible">
              <div className="mock-card" id="howMockCard">
                <div className="mock-header">
                  <div className="mock-title">Glasanje u tijeku</div>
                  <div className="mock-live">
                    <div className="live-dot"></div>
                    LIVE na Devnet
                  </div>
                </div>
                <div className="mock-question">🏖️ Kamo idemo na maturalno putovanje?</div>
                <div className="mock-options">
                  {[
                    ["🌊 Zadar", "62%", ""],
                    ["🌴 Split", "24%", "rose"],
                    ["🏰 Varaždin", "14%", "violet"],
                  ].map(([label, pct, color], index) => (
                    <div key={label} className={`mock-option ${index === 0 ? "selected" : ""}`}>
                      <div className={`option-bar ${color}`} style={{ width: pct }}></div>
                      <div className="option-content">
                        <span className="option-label">{label}</span>
                        <span className="option-pct">{pct}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mock-footer">
                  <div className="mock-voters">📊 34 glasova ukupno</div>
                  <div className="mock-chain">
                    <span className="chain-icon">◎</span>
                    Solana Devnet
                  </div>
                </div>
                <div className="wallet-chips">
                  <div className="wallet-chip">9xKz...4mRp</div>
                  <div className="wallet-chip">3dPw...8hQk</div>
                  <div className="wallet-chip">Bv7n...2jFs</div>
                  <div className="wallet-chip">+31 više</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="preview -mx-6" id="preview">
        <div className="container">
          <div className="preview-inner">
            <div className="preview-text reveal visible">
              <div className="section-tag">✦ Live Poll Preview</div>
              <h2 className="section-title">See every vote<br /><span>as it happens</span></h2>
              <p className="section-sub">
                Results are fetched directly from the Solana blockchain. There is no dashboard,
                no admin panel controlling what you see — just raw, on-chain data.
              </p>

              <div className="preview-features" style={{ marginTop: "32px" }}>
                {[
                  "Wallet addresses of all voters are publicly visible",
                  "Vote counts update in real time from chain",
                  "Every poll uses Phantom wallet authentication",
                  "Deadline, whitelist and close-poll controls are supported",
                ].map((text) => (
                  <div key={text} className="preview-feat">
                    <div className="feat-check">✓</div>
                    {text}
                  </div>
                ))}
              </div>
            </div>

            <div className="reveal visible">
              <div className="mock-card">
                <div className="mock-header">
                  <div className="mock-title">{featuredPoll ? featuredPoll.account.title : "Predsjednik razreda 2025"}</div>
                  <div className="mock-live">
                    <div className="live-dot"></div>
                    {featuredPoll?.account.isActive === false ? "Završeno" : "LIVE na Devnet"}
                  </div>
                </div>
                <div className="mock-question">{featuredPoll ? featuredPoll.account.title : "🎓 Tko će biti predsjednik razreda?"}</div>
                <div className="mock-options">
                  {(featuredPoll
                    ? featuredPoll.account.options.slice(0, 3).map((option: string, index: number) => {
                        const votes = featuredPoll.account.votes[index].toNumber();
                        const total = featuredPoll.account.totalVotes.toNumber();
                        const percentage = total === 0 ? 0 : Math.round((votes / total) * 100);
                        return [option, `${percentage}%`, index === 1 ? "rose" : index === 2 ? "violet" : ""];
                      })
                    : [
                        ["👤 Ana Kovačić", "51%", ""],
                        ["👤 Marko Horvat", "31%", "rose"],
                        ["👤 Petra Novak", "18%", "violet"],
                      ]
                  ).map(([label, pct, color]: string[], index: number) => (
                    <div key={`${label}-${index}`} className={`mock-option ${index === 0 ? "selected" : ""}`}>
                      <div className={`option-bar ${color}`} style={{ width: pct }}></div>
                      <div className="option-content">
                        <span className="option-label">{label}</span>
                        <span className="option-pct">{pct}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mock-footer">
                  <div className="mock-voters">
                    📊 {featuredPoll ? featuredPoll.account.totalVotes.toNumber() : 27} glasova
                  </div>
                  <div className="mock-chain">
                    <span className="chain-icon">◎</span>
                    Solana Devnet
                  </div>
                </div>
                <div className="wallet-chips">
                  <div className="wallet-chip">On-chain</div>
                  <div className="wallet-chip">Phantom</div>
                  <div className="wallet-chip">Anchor</div>
                  <div className="wallet-chip">Devnet</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="benefits -mx-6" id="benefits">
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "64px" }} className="reveal visible">
            <div className="section-tag">✦ Benefits</div>
            <h2 className="section-title">Why blockchain <span>voting</span>?</h2>
            <p className="section-sub" style={{ margin: "0 auto" }}>
              Traditional voting systems rely on trust. Blockchain voting relies on math.
            </p>
          </div>

          <div className="benefits-grid">
            {[
              ["🔒", "Zero Trust Required", "Ne morate vjerovati organizatoru ili serveru. Solana smart contract autonomno provodi sva pravila."],
              ["🌍", "Publicly Auditable", "Svaki glas je javno provjerljiv, zajedno s ukupnim rezultatom i wallet adresama glasača."],
              ["⚡", "Lightning Fast", "Solana Devnet omogućuje brzo kreiranje anketa i brzo slanje glasova putem Phantom walleta."],
              ["💎", "Permanent Record", "Blockchain podaci su nepromjenjivi. Jednom zapisan glas ne može se izmijeniti."],
            ].map(([icon, title, desc]) => (
              <div key={title} className="benefit-card reveal visible">
                <div className="benefit-icon">{icon}</div>
                <div className="benefit-text">
                  <h3>{title}</h3>
                  <p>{desc}</p>
                </div>
              </div>
            ))}
            <div className="benefit-card wide reveal visible">
              <div className="benefit-icon">🏫</div>
              <div className="benefit-text">
                <h3>Built for Schools — Ready for the World</h3>
                <p>
                  Bilo da razred bira izlet, majice ili predsjednika razreda, LIBROS daje institucionalnu razinu integriteta svakodnevnim odlukama.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24" id="polls">
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
