import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { serverEnv } from "./env";

// PIN hashing: scrypt with a random salt. Only the hash is stored.
export function hashPin(pin: string): string {
  const salt = crypto.randomBytes(16).toString("base64url");
  const hash = crypto.scryptSync(pin, salt, 32).toString("base64url");
  return `scrypt$${salt}$${hash}`;
}

export function verifyPin(pin: string, stored: string | null): boolean {
  if (!stored) return false;
  const [scheme, salt, hash] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const actual = crypto.scryptSync(pin, salt, 32);
  const expected = Buffer.from(hash, "base64url");
  return expected.length === actual.length && crypto.timingSafeEqual(actual, expected);
}

export function isValidPin(pin: string): boolean {
  return /^\d{4,6}$/.test(pin);
}

// Unlock session: an httpOnly cookie "<expiresAt>.<hmac>" that the server checks
// before rendering any journal content.
const COOKIE = "jl_unlock";
const FAILS = "jl_fails";

function key() {
  const env = serverEnv();
  return crypto
    .createHash("sha256")
    .update(`pin-lock:${env.serviceRoleKey || env.cronSecret || "dev"}`)
    .digest();
}

function sign(v: string) {
  return crypto.createHmac("sha256", key()).update(v).digest("base64url");
}

export async function isUnlocked(): Promise<boolean> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return false;
  const [exp, sig] = raw.split(".");
  if (!exp || !sig) return false;
  const good = sign(exp);
  if (good.length !== sig.length || !crypto.timingSafeEqual(Buffer.from(good), Buffer.from(sig))) {
    return false;
  }
  return Number(exp) > Date.now();
}

export async function grantUnlock(timeoutMinutes: number) {
  const exp = String(Date.now() + timeoutMinutes * 60_000);
  (await cookies()).set(COOKIE, `${exp}.${sign(exp)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}

export async function revokeUnlock() {
  (await cookies()).set(COOKIE, "", { path: "/", maxAge: 0 });
}

/** Simple throttle: after 5 wrong PINs, wait a minute. */
export async function failedAttempt(): Promise<void> {
  const jar = await cookies();
  const n = Number(jar.get(FAILS)?.value ?? "0") + 1;
  jar.set(FAILS, String(n), { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 });
}

export async function isThrottled(): Promise<boolean> {
  return Number((await cookies()).get(FAILS)?.value ?? "0") >= 5;
}

export async function clearFails() {
  (await cookies()).set(FAILS, "", { path: "/", maxAge: 0 });
}
