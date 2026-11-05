import "server-only";
import crypto from "node:crypto";
import { serverEnv } from "./env";

// Short sign-in codes to move a session to another device or to the iPhone
// Home Screen app (which doesn't share cookies with Safari, where email links
// open). Shown only to the signed-in owner. Stateless: an HMAC of a 5-minute
// time window, 8 characters (40 bits), accepted for the current and previous
// window, so each code works for 5 to 10 minutes and guessing is infeasible.

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 32 symbols, no 0/O or 1/I
const WINDOW_MS = 5 * 60_000;

function key(): Buffer {
  const env = serverEnv();
  return crypto
    .createHash("sha256")
    .update(`device-code:${env.serviceRoleKey || env.cronSecret || "dev"}:${env.allowedEmail}`)
    .digest();
}

function codeFor(window: number): string {
  const mac = crypto.createHmac("sha256", key()).update(`signin:${window}`).digest();
  let bits = mac.readUIntBE(0, 5); // 40 bits, safely within a JS number
  let out = "";
  for (let i = 0; i < 8; i++) {
    out = ALPHABET[bits % 32] + out;
    bits = Math.floor(bits / 32);
  }
  return out;
}

export function currentSignInCode(now = Date.now()): string {
  return codeFor(Math.floor(now / WINDOW_MS));
}

export function normalizeCode(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function isValidSignInCode(input: string, now = Date.now()): boolean {
  const given = normalizeCode(input);
  if (given.length !== 8) return false;
  const w = Math.floor(now / WINDOW_MS);
  return [w, w - 1].some((win) => {
    const expected = codeFor(win);
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(given));
  });
}

export function formatCode(code: string): string {
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}
