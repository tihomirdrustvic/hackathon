"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useState, useCallback, useEffect } from "react";

// Extend window type for Phantom
interface PhantomWindow extends Window {
  solana?: {
    isPhantom?: boolean;
    connect: (opts?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: { toString(): string } }>;
    disconnect: () => Promise<void>;
    publicKey?: { toString(): string };
  };
  phantom?: {
    solana?: {
      isPhantom?: boolean;
      connect: (opts?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: { toString(): string } }>;
    };
  };
}

declare const window: PhantomWindow;

export default function WalletButton() {
  const { connected, connecting, disconnect, publicKey, wallet, select, wallets, connect } = useWallet();
  const { setVisible } = useWalletModal();
  const [error, setError] = useState<string | null>(null);
  const [directConnecting, setDirectConnecting] = useState(false);

  const shortAddress = publicKey
    ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`
    : "";


  // Listen for Phantom external connect/disconnect events
  useEffect(() => {
    const solana = window.solana || window.phantom?.solana;
    if (!solana?.isPhantom) return;

    const handleConnect = () => {
      // Don't reload - let the adapter handle state sync
    };

    const handleDisconnect = () => {
      // Don't reload - let the adapter handle state sync
    };

    // Phantom emits 'connect' and 'disconnect' events
    (solana as any).on?.('connect', handleConnect);
    (solana as any).on?.('disconnect', handleDisconnect);

    return () => {
      (solana as any).off?.('connect', handleConnect);
      (solana as any).off?.('disconnect', handleDisconnect);
    };
  }, []);



  const tryConnect = useCallback(async (): Promise<boolean> => {
    setDirectConnecting(true);
    
    try {
      if (!wallet) {
        const phantomAdapter = wallets.find(w => w.adapter.name === "Phantom");
        if (phantomAdapter) {
          select(phantomAdapter.adapter.name);
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      await connect();
      return true;
    } catch {
      return false;
    } finally {
      setDirectConnecting(false);
    }
  }, [wallets, wallet, select, connect]);

  const handleClick = useCallback(async () => {
    setError(null);

    if (connected) {
      await disconnect();
      return;
    }

    if (connecting || directConnecting) return;

    const success = await tryConnect();
    if (!success) setVisible(true);
  }, [connected, connecting, directConnecting, disconnect, tryConnect, setVisible]);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <button
        type="button"
        id="wallet-connect-button"
        onClick={handleClick}
        disabled={connecting || directConnecting}
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "14px",
          fontWeight: 500,
          color: "rgba(255,255,255,0.8)",
          background: connected
            ? "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(244,63,94,0.2))"
            : "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.15)",
          padding: "8px 16px",
          borderRadius: "100px",
          cursor: (connecting || directConnecting) ? "wait" : "pointer",
          transition: "all 0.2s",
          letterSpacing: "0.01em",
          opacity: (connecting || directConnecting) ? 0.7 : 1,
        }}
        onMouseEnter={(e) => {
          if (!connecting && !directConnecting) {
            e.currentTarget.style.background = "rgba(255,255,255,0.1)";
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)";
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = connected
            ? "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(244,63,94,0.2))"
            : "rgba(255,255,255,0.05)";
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
        }}
      >
        {(connecting || directConnecting) ? "Connecting..." : connected ? shortAddress : "Connect Wallet"}
      </button>
      {error && (
        <span style={{ color: "#f43f5e", fontSize: "12px" }}>{error}</span>
      )}
    </div>
  );
}
