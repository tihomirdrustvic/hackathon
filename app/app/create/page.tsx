"use client";

import { useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import * as anchor from "@coral-xyz/anchor";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import idl from "../idl.json";
import { useRouter } from "next/navigation";

const PROGRAM_ID = new PublicKey("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

export default function CreatePoll() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleAddOption = () => {
    if (options.length >= 10) return;
    setOptions([...options, ""]);
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet.connected || !wallet.publicKey) {
      setError("Please connect your wallet first.");
      return;
    }
    const filteredOptions = options.filter(o => o.trim() !== "");
    if (filteredOptions.length < 2) {
      setError("Please provide at least 2 options.");
      return;
    }
    if (!title.trim()) {
      setError("Please provide a title.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const provider = new anchor.AnchorProvider(connection, wallet as any, { preflightCommitment: "processed" });
      const program = new anchor.Program(idl as any, PROGRAM_ID, provider);
      const pollKeypair = Keypair.generate();

      await program.methods
        .createPoll(title, filteredOptions)
        .accounts({
          poll: pollKeypair.publicKey,
          author: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([pollKeypair])
        .rpc();

      router.push(`/poll/${pollKeypair.publicKey.toString()}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to create poll");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto glass p-8 animate-fade-in mt-10">
      <h1 className="text-3xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">Create a New Poll</h1>
      
      {error && <div className="p-4 mb-6 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-300">Poll Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 transition"
            placeholder="What should we build next?"
            maxLength={50}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-gray-300">Voting Options</label>
          <div className="space-y-3">
            {options.map((option, index) => (
              <input
                key={index}
                type="text"
                value={option}
                onChange={(e) => handleOptionChange(index, e.target.value)}
                className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 transition"
                placeholder={`Option ${index + 1}`}
                maxLength={50}
              />
            ))}
          </div>
          {options.length < 10 && (
            <button
              type="button"
              onClick={handleAddOption}
              className="mt-3 text-sm text-pink-400 hover:text-pink-300 transition font-medium"
            >
              + Add another option
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-bold text-lg hover:opacity-90 transition disabled:opacity-50"
        >
          {isSubmitting ? "Creating on Blockchain..." : "Create Poll"}
        </button>
      </form>
    </div>
  );
}
