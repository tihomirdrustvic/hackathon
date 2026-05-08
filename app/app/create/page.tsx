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
  const [useWhitelist, setUseWhitelist] = useState(false);
  const [whitelistInput, setWhitelistInput] = useState("");

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

      const pollId = new anchor.BN(Date.now());

      const [pollPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("poll"),
          wallet.publicKey.toBuffer(),
          pollId.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      let deadline: anchor.BN | null = null;
      if (useDeadline && deadlineDate && deadlineTime) {
        const deadlineTimestamp = Math.floor(
          new Date(`${deadlineDate}T${deadlineTime}`).getTime() / 1000
        );
        if (deadlineTimestamp <= Math.floor(Date.now() / 1000)) {
          setError("Rok glasanja mora biti u budućnosti.");
          setIsSubmitting(false);
          return;
        }
        deadline = new anchor.BN(deadlineTimestamp);
      }

      let whitelist: PublicKey[] | null = null;
      if (useWhitelist && whitelistInput.trim()) {
        try {
          whitelist = whitelistInput
            .split(/[\n,]+/)
            .map((address) => address.trim())
            .filter(Boolean)
            .map((address) => new PublicKey(address));
        } catch {
          setError("Whitelist sadrži neispravnu wallet adresu.");
          setIsSubmitting(false);
          return;
        }
      }

      await program.methods
        .createPoll(pollId, title, filteredOptions, deadline, whitelist)
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
    <div className="max-w-2xl mx-auto animate-fade-up">
      {/* Header */}
      <div className="text-center mb-10 pt-4">
        <div className="section-tag mb-6">✦ Nova Anketa</div>
        <h1
          className="font-display font-extrabold mb-3"
          style={{
            fontSize: "clamp(32px, 4vw, 48px)",
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
          }}
        >
          Kreiraj <span className="text-gradient">anketu</span>
        </h1>
        <p style={{ fontSize: "16px", color: "rgba(255,255,255,0.4)" }}>
          Podaci se trajno zapisuju na Solana blockchain
        </p>
      </div>

      {/* Form Card */}
      <div className="glass p-8 sm:p-10">
        {error && (
          <div
            className="flex items-start gap-3 p-4 mb-6 rounded-2xl animate-fade-in"
            style={{
              background: "rgba(244, 63, 94, 0.08)",
              border: "1px solid rgba(244, 63, 94, 0.2)",
              color: "var(--rose-light)",
              fontSize: "14px",
            }}
            id="create-error"
          >
            <span className="text-lg mt-[-2px]">⚠</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-7">
          {/* Title */}
          <div>
            <label
              className="block font-display font-semibold text-sm mb-2"
              htmlFor="poll-title"
              style={{ color: "rgba(255,255,255,0.7)" }}
            >
              Naslov Ankete
            </label>
            <input
              id="poll-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl transition-all duration-200"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                outline: "none",
                fontSize: "16px",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "rgba(99,102,241,0.4)";
                e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "rgba(255,255,255,0.08)";
                e.target.style.boxShadow = "none";
              }}
              placeholder='npr. "Gdje idemo na izlet?"'
              maxLength={100}
            />
            <p className="mt-1.5" style={{ fontSize: "11px", color: "rgba(255,255,255,0.25)" }}>
              {title.length}/100 znakova
            </p>
          </div>

          {/* Options */}
          <div>
            <label
              className="block font-display font-semibold text-sm mb-3"
              style={{ color: "rgba(255,255,255,0.7)" }}
            >
              Opcije za Glasanje
            </label>
            <div className="space-y-3 stagger">
              {options.map((option, index) => (
                <div key={index} className="flex gap-3 items-center">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-display font-bold text-xs"
                    style={{
                      background: "linear-gradient(135deg, var(--indigo), var(--violet))",
                    }}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <input
                    id={`poll-option-${index}`}
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    className="flex-1 px-4 py-3 rounded-xl transition-all duration-200"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      outline: "none",
                      fontSize: "15px",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "rgba(99,102,241,0.4)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "rgba(255,255,255,0.08)";
                    }}
                    placeholder={`Opcija ${index + 1}`}
                    maxLength={50}
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(index)}
                      className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200"
                      style={{
                        background: "rgba(244,63,94,0.08)",
                        border: "1px solid rgba(244,63,94,0.15)",
                        color: "var(--rose)",
                      }}
                      id={`remove-option-${index}`}
                    >
                      ✕
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
                className="mt-4 font-display font-medium text-sm flex items-center gap-2 transition-colors duration-200"
                style={{ color: "var(--indigo-light)" }}
              >
                + Dodaj opciju ({options.length}/10)
              </button>
            )}
          </div>

          {/* Deadline Toggle */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "28px" }}>
            <div className="flex items-center gap-3 mb-4">
              <button
                type="button"
                onClick={() => setUseDeadline(!useDeadline)}
                id="toggle-deadline"
                className="relative w-11 h-6 rounded-full transition-all duration-300"
                style={{
                  background: useDeadline ? "var(--indigo)" : "rgba(255,255,255,0.08)",
                  border: useDeadline ? "none" : "1px solid rgba(255,255,255,0.12)",
                }}
              >
                <span
                  className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-300"
                  style={{
                    transform: useDeadline ? "translateX(20px)" : "translateX(0)",
                  }}
                />
              </button>
              <div>
                <span className="font-display font-semibold text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
                  Vremensko Ograničenje
                </span>
                <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)", marginTop: "2px" }}>
                  Automatski zatvori glasanje nakon roka
                </p>
              </div>
            </div>

            {useDeadline && (
              <div className="grid grid-cols-2 gap-3 animate-fade-in">
                <div>
                  <label className="block text-xs font-medium mb-1.5" htmlFor="deadline-date" style={{ color: "rgba(255,255,255,0.3)" }}>
                    Datum
                  </label>
                  <input
                    id="deadline-date"
                    type="date"
                    value={deadlineDate}
                    onChange={(e) => setDeadlineDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm transition-all duration-200"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      outline: "none",
                    }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" htmlFor="deadline-time" style={{ color: "rgba(255,255,255,0.3)" }}>
                    Vrijeme
                  </label>
                  <input
                    id="deadline-time"
                    type="time"
                    value={deadlineTime}
                    onChange={(e) => setDeadlineTime(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm transition-all duration-200"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      outline: "none",
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "28px" }}>
            <div className="flex items-center gap-3 mb-4">
              <button
                type="button"
                onClick={() => setUseWhitelist(!useWhitelist)}
                id="toggle-whitelist"
                className="relative w-11 h-6 rounded-full transition-all duration-300"
                style={{
                  background: useWhitelist ? "var(--indigo)" : "rgba(255,255,255,0.08)",
                  border: useWhitelist ? "none" : "1px solid rgba(255,255,255,0.12)",
                }}
              >
                <span
                  className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-300"
                  style={{
                    transform: useWhitelist ? "translateX(20px)" : "translateX(0)",
                  }}
                />
              </button>
              <div>
                <span className="font-display font-semibold text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
                  Whitelist wallet adresa
                </span>
                <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)", marginTop: "2px" }}>
                  Ako je uključeno, glasati mogu samo upisane adrese
                </p>
              </div>
            </div>

            {useWhitelist && (
              <div className="animate-fade-in">
                <label className="block text-xs font-medium mb-1.5" htmlFor="whitelist-addresses" style={{ color: "rgba(255,255,255,0.3)" }}>
                  Wallet adrese, odvojene novim redom ili zarezom
                </label>
                <textarea
                  id="whitelist-addresses"
                  value={whitelistInput}
                  onChange={(e) => setWhitelistInput(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm transition-all duration-200 min-h-[110px]"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    outline: "none",
                    color: "var(--white)",
                    fontFamily: "var(--font-body)",
                  }}
                  placeholder="9xKz...4mRp&#10;3dPw...8hQk"
                />
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            id="submit-poll"
            className="btn-primary w-full justify-center text-base py-4"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span
                  className="w-4 h-4 rounded-full animate-spin"
                  style={{
                    border: "2px solid rgba(255,255,255,0.3)",
                    borderTopColor: "white",
                  }}
                />
                Zapisujem na blockchain...
              </span>
            ) : (
              "Kreiraj Anketu →"
            )}
          </button>
        </form>

        {/* Info */}
        <div
          className="mt-7 p-4 rounded-2xl"
          style={{
            background: "rgba(99, 102, 241, 0.05)",
            border: "1px solid rgba(99, 102, 241, 0.1)",
          }}
        >
          <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.35)", lineHeight: 1.7 }}>
            💡 Kreiranje ankete zahtijeva malu količinu SOL-a za troškove transakcije.
            Koristite{" "}
            <code
              style={{
                background: "var(--surface)",
                padding: "2px 6px",
                borderRadius: "4px",
                fontSize: "12px",
                color: "var(--indigo-light)",
              }}
            >
              solana airdrop 2
            </code>{" "}
            za besplatne testne tokene na Devnetu.
          </p>
        </div>
      </div>
    </div>
  );
}
