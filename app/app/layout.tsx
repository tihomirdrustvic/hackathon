import "./globals.css";
import Providers from "./Providers";
import dynamic from 'next/dynamic';
import Link from 'next/link';

// Dynamically import WalletMultiButton to prevent hydration errors
const WalletMultiButtonDynamic = dynamic(
  async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
  { ssr: false }
);

export const metadata = {
  title: "Solana Voting DApp",
  description: "A decentralized voting application on Solana.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Providers>
          <nav className="p-4 flex justify-between items-center bg-black/30 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
            <Link href="/" className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
              VoteDApp
            </Link>
            <div className="flex gap-4 items-center">
              <Link href="/create" className="text-sm font-semibold hover:text-pink-400 transition">
                Create Poll
              </Link>
              <WalletMultiButtonDynamic />
            </div>
          </nav>
          <main className="max-w-4xl mx-auto p-6">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
