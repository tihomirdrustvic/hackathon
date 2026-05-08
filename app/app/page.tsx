"use client";

import { useEffect, useState, useCallback } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import Link from "next/link";
import { GlowCard } from "./components/GlowCard";

export default function Home() {
  const { connection } = useConnection();
  useWallet();
  const [polls, setPolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pollError, setPollError] = useState("");
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchPolls = useCallback(async () => {
    setRefreshing(true);
    setPollError("");

    try {
      const res = await fetch("/api/fetch-polls");
      if (!res.ok) {
        throw new Error("Failed to fetch polls");
      }
      const data = await res.json();

      setPolls(
        data.polls.sort((a: any, b: any) =>
          b.account.deadline - a.account.deadline
        )
      );
      setLastRefresh(new Date());
    } catch (err: any) {
      console.error("Error fetching polls:", err);
      setPollError(err.message || "Ne mogu dohvatiti ankete s Devnet mreže.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPolls();
  }, [fetchPolls]);

  // Live auto-refresh every 15 seconds (bonus)
  useEffect(() => {
    const interval = setInterval(fetchPolls, 15000);
    return () => clearInterval(interval);
  }, [fetchPolls]);

  const toNumber = (value: any) => {
    if (typeof value === "number") return value;
    if (typeof value === "bigint") return Number(value);
    if (value && typeof value.toNumber === "function") return value.toNumber();
    return 0;
  };

  const getPollOptions = (poll: any) =>
    Array.isArray(poll?.account?.options) ? poll.account.options : [];

  const getOptionLabel = (option: any) =>
    typeof option === "string" ? option : option?.name ?? "";

  const getOptionVotes = (poll: any, option: any, index: number) =>
    toNumber(
      option && typeof option === "object" && "votes" in option
        ? option.votes
        : poll?.account?.votes?.[index]
    );

  const getTotalVotes = (poll: any) => toNumber(poll?.account?.totalVotes);

  const totalVotes = polls.reduce(
    (acc, p) => acc + getTotalVotes(p),
    0
  );
  const featuredPoll = polls[0];

  return (
    <div className="animate-fade-up">
      <section className="hero -mt-24" id="hero">
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
          <h1 className="hero-title">
            <span className="hero-title-line1">Glasaj Bez</span>
            <span className="hero-title-line2">Kompromisa</span>
          </h1>

          <p className="hero-sub">
            Decentralizirano glasanje na Solana blockchainu — svaki glas je trajan,
            provjerljiv i zaštićen kriptografijom.
          </p>

          <div className="hero-actions">
            <Link href="/create" id="hero-create-poll" className="btn-hero-primary">
              Kreiraj Anketu
            </Link>
            <Link href="#polls" id="hero-view-polls" className="btn-hero-secondary">
              Pregledaj ankete <span>→</span>
            </Link>
          </div>

          <div className="hero-stats">
            {[
              { num: "100%", label: "Nepromjenjivo" },
              { num: "<1s", label: "Solana Finality" },
              { num: `${polls.length}`, label: "Anketa na lancu" },
              { num: `${totalVotes}`, label: "Zapisanih glasova" },
            ].map((stat) => (
              <div key={stat.label} className="stat">
                <div className="stat-num">{stat.num}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="features" id="features">
        <div className="container">
          <div className="features-header reveal visible">
            <div className="section-tag">✦ Značajke</div>
            <h2 className="section-title-pixelify">Izgrađeno za <span>povjerenje</span></h2>
            <p className="section-sub">
              Svaka značajka dizajnirana je oko jednog načela: tvoj glas pripada tebi,
              a ne nekom serveru ili administratoru.
            </p>
          </div>

          <div className="features-grid">
            {[
              {
                icon: "🔐",
                color: "indigo" as const,
                title: "Identitet Walleta",
                desc: "Svaki glasač se autentificira putem Phantom walleta. Nema računa, nema lozinki — samo kriptografski potvrđen identitet.",
              },
              {
                icon: "🚫",
                color: "rose" as const,
                title: "Bez Duplog Glasanja",
                desc: "PDA računi na Solani osiguravaju jedan glas po walletu. Blockchain sprječava duplicirane glasove.",
              },
              {
                icon: "📡",
                color: "violet" as const,
                title: "Pohrana na Lancu",
                desc: "Ankete, opcije, glasovi i wallet adrese pohranjeni su na Solana Devnetu — bez privatnog servera.",
              },
              {
                icon: "⚡",
                color: "amber" as const,
                title: "Brza Finalizacija",
                desc: "Solana brzo potvrđuje transakcije, a svaki glas ostaje trajno zapisan na blockchainu.",
              },
              {
                icon: "🔍",
                color: "cyan" as const,
                title: "Javna Provjera",
                desc: "Svatko može provjeriti rezultate i wallet adrese glasača direktno iz javnih on-chain podataka.",
              },
              {
                icon: "🛡️",
                color: "green" as const,
                title: "Zaštita od Admina",
                desc: "Smart contract provodi pravila. Jednom dani glas ni kreator ankete ne može promijeniti ili ukloniti.",
              },
            ].map((feat) => (
              <GlowCard
                key={feat.title}
                customSize
                bare
                glowColor={feat.color}
                width="100%"
                className="feature-card reveal visible"
              >
                <div className={`feature-icon ${feat.color}`}>{feat.icon}</div>
                <div className="feature-title">{feat.title}</div>
                <p className="feature-desc">{feat.desc}</p>
              </GlowCard>
            ))}
          </div>
        </div>
      </section>

      <section className="how" id="how">
        <div className="container">
          <div className="how-inner">
            <div>
              <div className="section-tag reveal visible">✦ Kako Funkcionira</div>
              <h2 className="section-title-pixelify reveal visible">Četiri koraka do <span>nepromjenjive</span> demokracije</h2>
              <p className="section-sub reveal visible" style={{ marginBottom: "48px" }}>
                Pokretano Anchor Frameworkom i Solana blockchainom. Izgrađeno u Rustu za maksimalnu sigurnost i performanse.
              </p>

              <div className="how-steps">
                {[
                  ["01", "Poveži Phantom Wallet", "Bez registracije. Tvoja wallet adresa je tvoj identitet — verificirana pri svakoj akciji."],
                  ["02", "Kreiraj ili Pronađi Anketu", "Definiraj pitanje, dodaj opcije i objavi anketu. U sekundi je dostupna svim glasačima na blockchainu."],
                  ["03", "Glasaj na Blockchainu", "Instrukcija za glasanje kreira PDA vezan za tvoj wallet, čineći duplo glasanje nemogućim."],
                  ["04", "Prati Rezultate Uživo", "Rezultati se čitaju direktno s lanca, uključujući ukupan broj i wallet adrese glasača."],
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
                <div className="mock-question">Kamo idemo na maturalno putovanje?</div>
                <div className="mock-options">
                  {[
                    ["Prag", "62%", ""],
                    ["Španjolska", "24%", "rose"],
                    ["Grčka", "14%", "violet"],
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

      <section className="preview" id="preview">
        <div className="container">
          <div className="preview-inner">
            <div className="preview-text reveal visible">
              <div className="section-tag">✦ Pregled Ankete Uživo</div>
              <h2 className="section-title-pixelify">Svaki glas<br /><span>u trenutku</span></h2>
              <p className="section-sub">
                Rezultati se dohvaćaju direktno sa Solana blockchaina. Nema nadzorne ploče,
                nema admin panela koji kontrolira što vidiš — samo transparentni, javno dostupni podaci.
              </p>

              <div className="preview-features" style={{ marginTop: "32px" }}>
                {[
                  "Wallet adrese svih glasača su javno vidljive",
                  "Broj glasova se ažurira u stvarnom vremenu s lanca",
                  "Svaka anketa koristi Phantom wallet autentifikaciju",
                  "Podržani su rok glasanja, whitelist i zatvaranje ankete",
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
                    ? getPollOptions(featuredPoll).slice(0, 3).map((option: any, index: number) => {
                      const votes = getOptionVotes(featuredPoll, option, index);
                      const total = getTotalVotes(featuredPoll);
                      const percentage = total === 0 ? 0 : Math.round((votes / total) * 100);
                      return [getOptionLabel(option), `${percentage}%`, index === 1 ? "rose" : index === 2 ? "violet" : ""];
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
                    📊 {featuredPoll ? getTotalVotes(featuredPoll) : 27} glasova
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

      <section className="benefits" id="benefits">
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "64px" }} className="reveal visible">
            <div className="section-tag">✦ Prednosti</div>
            <h2 className="section-title-pixelify">Zašto blockchain <span>glasanje</span>?</h2>
            <p className="section-sub" style={{ margin: "0 auto" }}>
              Tradicionalni sustavi glasanja oslanjaju se na povjerenje. Blockchain glasanje oslanja se na matematiku.
            </p>
          </div>

          <div className="benefits-grid">
            {[
              ["🔒", "Maksimalno Povjerenja", "Ne morate vjerovati organizatoru ili serveru. Solana smart contract autonomno provodi sva pravila.", "blue"],
              ["🌍", "Javno Provjerljivo", "Svaki glas je javno provjerljiv, zajedno s ukupnim rezultatom i wallet adresama glasača.", "green"],
              ["⚡", "Munjevita Brzina", "Solana Devnet omogućuje brzo kreiranje anketa i brzo slanje glasova putem Phantom walleta.", "amber"],
              ["💎", "Trajni Zapis", "Blockchain podaci su nepromjenjivi. Jednom zapisan glas ne može se izmijeniti.", "violet"],
            ].map(([icon, title, desc, color]) => (
              <GlowCard
                key={title}
                customSize
                bare
                glowColor={color as any}
                width="100%"
                className="benefit-card reveal visible"
              >
                <div className="benefit-icon">{icon}</div>
                <div className="benefit-text">
                  <h3>{title}</h3>
                  <p>{desc}</p>
                </div>
              </GlowCard>
            ))}
            <GlowCard
              customSize
              bare
              glowColor="purple"
              width="100%"
              className="benefit-card wide reveal visible"
            >
              <div className="benefit-icon">🏫</div>
              <div className="benefit-text">
                <h3>Stvoreno za Škole — Spremno za Svijet</h3>
                <p>
                  Bilo da razred bira izlet, majice ili predsjednika razreda, LIBROS daje institucionalnu razinu integriteta svakodnevnim odlukama.
                </p>
              </div>
            </GlowCard>
          </div>
        </div>
      </section>

      <section className="container py-24" id="polls">
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
            disabled={refreshing}
            id="refresh-polls"
            className="btn-ghost text-sm flex items-center gap-2 py-2 px-3"
            style={{ whiteSpace: "nowrap", opacity: refreshing ? 0.6 : 1 }}
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
        ) : pollError ? (
          <div className="glass p-10 text-center">
            <p
              className="font-display font-bold text-lg mb-3"
              style={{ color: "var(--rose-light)" }}
            >
              Ne mogu učitati ankete
            </p>
            <p className="mb-6" style={{ fontSize: "14px", color: "rgba(255,255,255,0.45)" }}>
              {pollError}
            </p>
            <button
              type="button"
              onClick={fetchPolls}
              className="btn-primary px-7 py-3"
            >
              Pokušaj ponovno
            </button>
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
                const votes = getTotalVotes(poll);
                const isActive = poll.account.isActive;
                const createdDate = new Date(
                  toNumber(poll.account.timestamp) * 1000
                );

                return (
                  <Link
                    href={`/poll/${poll.publicKey.toString()}`}
                    key={poll.publicKey.toString()}
                    id={`poll-card-${poll.publicKey.toString().slice(0, 8)}`}
                  >
                    <GlowCard
                      customSize
                      glowColor={isActive ? "green" : "red"}
                      width="100%"
                      className="card p-7 cursor-pointer group min-h-[160px] transition-transform duration-200 hover:-translate-y-1"
                    >
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
                            border: `1px solid ${isActive
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
                        <span>{getPollOptions(poll).length} opcija</span>
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
                    </GlowCard>
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
