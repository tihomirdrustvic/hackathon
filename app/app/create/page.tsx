"use client";

import { useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import * as anchor from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import idl from "../idl.json";
import { useRouter } from "next/navigation";

const PROGRAM_ID = new PublicKey(
  "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS"
);

export default function CreatePoll() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [useDeadline, setUseDeadline] = useState(false);
  const [deadlineDate, setDeadlineDate] = useState("");
  const [deadlineTime, setDeadlineTime] = useState("");

  const handleAddOption = () => {
    if (options.length >= 10) return;
    setOptions([...options, ""]);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!wallet.connected || !wallet.publicKey) {
      setError("Molimo spojite Phantom wallet prije kreiranja ankete.");
      return;
    }

    const filteredOptions = options.filter((o) => o.trim() !== "");
    if (filteredOptions.length < 2) {
      setError("Molimo unesite barem 2 opcije.");
      return;
    }
    if (!title.trim()) {
      setError("Molimo unesite naslov ankete.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const provider = new anchor.AnchorProvider(connection, wallet as any, {
        preflightCommitment: "processed",
      });
      const program = new anchor.Program(idl as any, PROGRAM_ID, provider);

      // Generate a unique poll ID based on timestamp
      const pollId = new anchor.BN(Date.now());

      // Derive PDA for the poll
      const [pollPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("poll"),
          wallet.publicKey.toBuffer(),
          pollId.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      // Calculate deadline if set
      let deadline: anchor.BN | null = null;
      if (useDeadline && deadlineDate && deadlineTime) {
        const deadlineTimestamp = Math.floor(
          new Date(`${deadlineDate}T${deadlineTime}`).getTime() / 1000
        );
        deadline = new anchor.BN(deadlineTimestamp);
      }

      await program.methods
        .createPoll(pollId, title, filteredOptions, deadline, null)
        .accounts({
          poll: pollPda,
          author: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      router.push(`/poll/${pollPda.toString()}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Greška pri kreiranju ankete.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in-up">
      {/* ─── Header ─────────────────────────────────────────── */}
      <div className="text-center mb-8 pt-4">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-3">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
            Kreiraj Novu Anketu
          </span>
        </h1>
        <p className="text-sm text-slate-400">
          Podaci se trajno zapisuju na Solana blockchain
        </p>
      </div>

      {/* ─── Form Card ──────────────────────────────────────── */}
      <div className="glass p-6 sm:p-8">
        {error && (
          <div
            className="flex items-start gap-3 p-4 mb-6 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm animate-fade-in"
            id="create-error"
          >
            <svg
              className="w-5 h-5 shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label
              className="block text-sm font-semibold mb-2 text-slate-300"
              htmlFor="poll-title"
            >
              Naslov Ankete
            </label>
            <input
              id="poll-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3.5 bg-white/[0.03] border border-white/[0.08] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-300 text-white placeholder:text-slate-600"
              placeholder='npr. "Gdje idemo na izlet?"'
              maxLength={100}
            />
            <p className="text-[11px] text-slate-600 mt-1.5">
              {title.length}/100 znakova
            </p>
          </div>

          {/* Options */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-300">
              Opcije za Glasanje
            </label>
            <div className="space-y-3 stagger-children">
              {options.map((option, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <span className="text-xs text-slate-600 font-mono w-5 text-center shrink-0">
                    {index + 1}
                  </span>
                  <input
                    id={`poll-option-${index}`}
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    className="flex-1 px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-300 text-white placeholder:text-slate-600"
                    placeholder={`Opcija ${index + 1}`}
                    maxLength={50}
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(index)}
                      className="shrink-0 w-9 h-9 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all duration-300 flex items-center justify-center"
                      id={`remove-option-${index}`}
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
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>

            {options.length < 10 && (
              <button
                type="button"
                onClick={handleAddOption}
                id="add-option"
                className="mt-3 flex items-center gap-1.5 text-sm text-indigo-400 hover:text-indigo-300 transition-colors duration-300 font-medium"
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
                Dodaj opciju ({options.length}/10)
              </button>
            )}
          </div>

          {/* Deadline (Bonus feature) */}
          <div className="border-t border-white/[0.06] pt-6">
            <div className="flex items-center gap-3 mb-4">
              <button
                type="button"
                onClick={() => setUseDeadline(!useDeadline)}
                id="toggle-deadline"
                className={`relative w-11 h-6 rounded-full transition-all duration-300 ${
                  useDeadline
                    ? "bg-indigo-500"
                    : "bg-white/[0.08] border border-white/[0.12]"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-300 ${
                    useDeadline ? "translate-x-5" : ""
                  }`}
                />
              </button>
              <div>
                <span className="text-sm font-semibold text-slate-300">
                  Vremensko Ograničenje
                </span>
                <p className="text-[11px] text-slate-500">
                  Automatski zatvori glasanje nakon određenog vremena
                </p>
              </div>
            </div>

            {useDeadline && (
              <div className="grid grid-cols-2 gap-3 animate-fade-in">
                <div>
                  <label
                    className="block text-xs font-medium mb-1.5 text-slate-500"
                    htmlFor="deadline-date"
                  >
                    Datum
                  </label>
                  <input
                    id="deadline-date"
                    type="date"
                    value={deadlineDate}
                    onChange={(e) => setDeadlineDate(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all duration-300 text-white text-sm"
                  />
                </div>
                <div>
                  <label
                    className="block text-xs font-medium mb-1.5 text-slate-500"
                    htmlFor="deadline-time"
                  >
                    Vrijeme
                  </label>
                  <input
                    id="deadline-time"
                    type="time"
                    value={deadlineTime}
                    onChange={(e) => setDeadlineTime(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all duration-300 text-white text-sm"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            id="submit-poll"
            className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl font-bold text-base shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Zapisujem na blockchain...
              </span>
            ) : (
              "Kreiraj Anketu na Blockchainu"
            )}
          </button>
        </form>

        {/* Info */}
        <div className="mt-6 p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
          <p className="text-xs text-slate-500 leading-relaxed">
            💡 Kreiranje ankete zahtijeva malu količinu SOL-a za transakcijske
            troškove na Devnet mreži. Koristite{" "}
            <code className="text-indigo-400 bg-indigo-500/10 px-1 py-0.5 rounded">
              solana airdrop 2
            </code>{" "}
            za besplatne testne tokene.
          </p>
        </div>
      </div>
    </div>
  );
}
