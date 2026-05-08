import "./buffer-polyfill";
import "./globals.css";
import Providers from "./Providers";
import Link from "next/link";
import WalletButton from "./WalletButton";

export const metadata = {
  title: "LIBROS — Decentralizirano Glasanje na Solana Blockchainu",
  description:
    "Decentralizirana aplikacija za glasanje na Solana blockchainu. Kreirajte ankete i glasajte sigurno putem Phantom walleta. Svi glasovi su trajno zapisani na Devnetu.",
  keywords: "solana, blockchain, voting, dapp, decentralized, phantom, anchor, libros",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="hr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Pixelify+Sans:wght@400..700&family=Space+Grotesk:wght@300..700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>
          {/* ─── Navigation ─────────────────────────────────── */}
          <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none" style={{ paddingTop: "16px" }}>
            <div
              className="pointer-events-auto flex items-center justify-between gap-6 px-8 py-3"
              style={{
                width: "min(960px, calc(100% - 32px))",
                background: "rgba(8, 8, 12, 0.80)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                border: "1px solid rgba(255,255,255,0.10)",
                borderRadius: "100px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
              }}
            >
              <Link
                href="/"
                id="nav-home"
                className="font-display font-extrabold text-[20px] tracking-tight text-gradient shrink-0"
                style={{ letterSpacing: "-0.5px" }}
              >
                LIBROS
              </Link>

              <style>{`
                .wallet-adapter-button .wallet-adapter-button-start-icon { display: none !important; }
              `}</style>

              <div className="flex items-center gap-4">
                <WalletButton />
                <Link
                  href="/create"
                  id="nav-create-poll"
                  className="btn-primary hidden sm:inline-flex"
                >
                  Kreiraj Anketu
                </Link>
              </div>
            </div>
          </nav>

          {/* ─── Main Content ───────────────────────────────── */}
          <main className="w-full pt-24 pb-12 min-h-screen relative z-10 overflow-hidden">
            {children}
          </main>

          {/* ─── Footer ─────────────────────────────────────── */}
          <footer
            className="relative z-10 py-10"
            style={{
              borderTop: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div className="max-w-[1200px] mx-auto px-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span
                    className="font-display font-extrabold text-lg text-gradient"
                  >
                    LIBROS
                  </span>
                  <span className="text-[13px]" style={{ color: "rgba(255,255,255,0.4)" }}>
                    Decentralizirano glasanje na Solana blockchainu
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className="text-[12px] flex items-center gap-1.5"
                    style={{
                      color: "rgba(255,255,255,0.4)",
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      padding: "6px 12px",
                      borderRadius: "8px",
                    }}
                  >
                    <span style={{ fontSize: "16px" }}>◎</span>
                    Solana Devnet
                  </span>
                </div>
              </div>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
