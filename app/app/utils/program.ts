import { PublicKey } from "@solana/web3.js";
import { Buffer } from "buffer";

export const RPC_ENDPOINT =
  process.env.NEXT_PUBLIC_RPC_URL || "https://api.devnet.solana.com";

export const PROGRAM_ID = new PublicKey(
  "GwqoDrpHQHiKWbHA6RFr84tNZbm22u8UTQABKDt8j8KM"
);

export function computePollPda(
  authorKey: PublicKey,
  pollId: number | bigint,
  programId: PublicKey
): PublicKey {
  const pollIdBigInt = BigInt(pollId.toString());
  const pollIdBuffer = Buffer.alloc(8);
  for (let i = 0; i < 8; i++) {
    pollIdBuffer[i] = Number((pollIdBigInt >> BigInt(i * 8)) & BigInt(0xff));
  }
  
  const [pda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("poll"),
      authorKey.toBuffer(),
      pollIdBuffer,
    ],
    programId
  );
  return pda;
}

export function voteRecordPda(
  pollKey: PublicKey,
  voterKey: PublicKey,
  programId: PublicKey
): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("vote"),
      pollKey.toBuffer(),
      voterKey.toBuffer(),
    ],
    programId
  );
  return pda;
}
