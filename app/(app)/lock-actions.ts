"use server";

import { getPinHash, getProfileRow, setPinHash } from "@/lib/data/profile";
import {
  clearFails,
  failedAttempt,
  grantUnlock,
  isThrottled,
  isUnlocked,
  isValidPin,
  hashPin,
  revokeUnlock,
  verifyPin,
} from "@/lib/pin";

export async function unlockAction(pin: string): Promise<{ ok: boolean; throttled?: boolean }> {
  if (await isThrottled()) return { ok: false, throttled: true };
  const profile = await getProfileRow();
  if (!profile.pin_hash) return { ok: true };
  if (!verifyPin(pin, profile.pin_hash)) {
    await failedAttempt();
    await new Promise((r) => setTimeout(r, 400));
    return { ok: false };
  }
  await clearFails();
  await grantUnlock(profile.lock_timeout_minutes);
  return { ok: true };
}

/** Called while the user is active, extends the unlock window. */
export async function heartbeatAction(): Promise<{ locked: boolean }> {
  const profile = await getProfileRow();
  if (!profile.pin_hash) return { locked: false };
  if (!(await isUnlocked())) return { locked: true };
  await grantUnlock(profile.lock_timeout_minutes);
  return { locked: false };
}

export async function lockNowAction() {
  await revokeUnlock();
}

export async function setPinAction(pin: string | null): Promise<{ ok: boolean }> {
  if (pin === null) {
    await setPinHash(null);
    await revokeUnlock();
    return { ok: true };
  }
  if (!isValidPin(pin)) return { ok: false };
  await setPinHash(hashPin(pin));
  const profile = await getProfileRow();
  await grantUnlock(profile.lock_timeout_minutes);
  return { ok: true };
}

export async function hasPinAction() {
  return Boolean(await getPinHash());
}
