import "./globals.css";
import Providers from "./Providers";
import dynamic from "next/dynamic";
import Link from "next/link";

const WalletMultiButtonDynamic = dynamic(
  async () =>
    (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

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
      </head>
      <body>
        <Providers>
          {/* ─── Navigation ─────────────────────────────────── */}
          <nav
            className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
            style={{
              background: "rgba(3, 3, 3, 0.85)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div className="max-w-[1200px] mx-auto px-6 py-4 flex items-center justify-between">
              <Link
                href="/"
                id="nav-home"
                className="font-display font-extrabold text-[22px] tracking-tight text-gradient"
                style={{ letterSpacing: "-0.5px" }}
              >
                LIBROS
              </Link>

              <div className="flex items-center gap-3 sm:gap-4">
                <Link
                  href="/create"
                  id="nav-create-poll"
                  className="btn-ghost hidden sm:inline-flex"
                >
                  Kreiraj Anketu
                </Link>
                <WalletMultiButtonDynamic />
              </div>
            </div>
          </nav>

          {/* ─── Main Content ───────────────────────────────── */}
          <main className="max-w-[1200px] mx-auto px-6 pt-24 pb-12 min-h-screen relative z-10">
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
                  <span className="text-[13px]" style={{ color: "rgba(255,255,255,0.4)" }}>
                    LIBROS Hackathon 2026
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
