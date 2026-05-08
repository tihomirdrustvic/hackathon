"use client";

import { Buffer } from 'buffer';

// Polyfill Buffer globally BEFORE any Anchor/Solana imports
if (typeof window !== 'undefined') {
  (window as any).Buffer = Buffer;
  (globalThis as any).Buffer = Buffer;
}

import { useMemo, useEffect, useState } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { RPC_ENDPOINT } from './utils/program';
import '@solana/wallet-adapter-react-ui/styles.css';

export default function Providers({ children }: { children: React.ReactNode }) {
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => RPC_ENDPOINT, []);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter({ network }),
    ],
    [network]
  );

  // Custom error handler for wallet connection
  const onError = useMemo(
    () => (error: any) => {
      console.error("[WalletProvider] Error:", error);
      // Don't throw - just log to prevent UI crashes
    },
    []
  );

  // Don't render children without providers - return null to avoid
  // useWallet() calls in children crashing from missing WalletContext
  if (!mounted) {
    return null;
  }

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider
        wallets={wallets}
        autoConnect={false}
        onError={onError}
      >
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
