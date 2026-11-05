import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key";
process.env.ALLOWED_EMAIL = "me@example.com";

const { currentSignInCode, formatCode, isValidSignInCode } = await import("@/lib/device-code");

describe("sign-in codes", () => {
  const t0 = Date.UTC(2026, 10, 5, 10, 2, 0);

  it("are 8 unambiguous characters", () => {
    const c = currentSignInCode(t0);
    expect(c).toMatch(/^[A-HJ-NP-Z2-9]{8}$/);
    expect(formatCode(c)).toMatch(/^.{4}-.{4}$/);
  });

  it("work for 5 to 10 minutes, with or without the dash and in any case", () => {
    const c = currentSignInCode(t0);
    expect(isValidSignInCode(c, t0)).toBe(true);
    expect(isValidSignInCode(formatCode(c).toLowerCase(), t0 + 4 * 60_000)).toBe(true);
    // t0 is 10:02, so this code's window started at 10:00 and it is still accepted until 10:10.
    expect(isValidSignInCode(c, t0 + 7 * 60_000)).toBe(true);
    expect(isValidSignInCode(c, t0 + 11 * 60_000)).toBe(false);
  });

  it("reject wrong or malformed codes", () => {
    expect(isValidSignInCode("AAAA-AAAA", t0)).toBe(currentSignInCode(t0) === "AAAAAAAA");
    expect(isValidSignInCode("short", t0)).toBe(false);
    expect(isValidSignInCode("", t0)).toBe(false);
  });

  it("change from one window to the next", () => {
    expect(currentSignInCode(t0)).not.toBe(currentSignInCode(t0 + 5 * 60_000));
  });
});
