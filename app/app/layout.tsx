import "./globals.css";
import Providers from "./Providers";
import dynamic from "next/dynamic";
import Link from "next/link";

// Dynamically import WalletMultiButton to prevent hydration errors
const WalletMultiButtonDynamic = dynamic(
  async () =>
    (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

export const metadata = {
  title: "VoteDApp — Decentralizirana Aplikacija za Glasanje",
  description:
    "Decentralizirana aplikacija za glasanje na Solana blockchainu. Kreirajte ankete i glasajte sigurno putem Phantom walleta.",
  keywords: "solana, blockchain, voting, dapp, decentralized, phantom, anchor",
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
      <body className="antialiased">
        <Providers>
          {/* ─── Navigation ─────────────────────────────────── */}
          <nav className="sticky top-0 z-50 px-4 sm:px-6 py-3 flex justify-between items-center glass border-t-0 border-l-0 border-r-0 rounded-none border-b border-white/[0.06]">
            <Link
              href="/"
              className="flex items-center gap-2 group"
              id="nav-home"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-black shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-all duration-300 group-hover:scale-105">
                V
              </div>
              <span className="text-lg font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                VoteDApp
              </span>
            </Link>

            <div className="flex gap-2 sm:gap-4 items-center">
              <Link
                href="/create"
                id="nav-create-poll"
                className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.15] transition-all duration-300"
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
                Nova Anketa
              </Link>
              <WalletMultiButtonDynamic />
            </div>
          </nav>

          {/* ─── Main Content ───────────────────────────────── */}
          <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 min-h-[calc(100vh-64px)]">
            {children}
          </main>

          {/* ─── Footer ─────────────────────────────────────── */}
          <footer className="border-t border-white/[0.06] py-6 text-center text-xs text-slate-500">
            <p>
              VoteDApp — Izgrađeno na{" "}
              <span className="text-indigo-400 font-medium">
                Solana Devnet
              </span>{" "}
              s Anchor Frameworkom
            </p>
            <p className="mt-1 text-slate-600">
              LIBROS Hackathon 2026 • Svi glasovi trajno zapisani na blockchainu
            </p>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
