import "server-only";
import crypto from "node:crypto";
import type { NextRequest } from "next/server";
import { serverEnv } from "./env";

/** Cron endpoints require "Authorization: Bearer <CRON_SECRET>" (Vercel Cron sends this automatically). */
export function isAuthorizedCron(req: NextRequest): boolean {
  const secret = serverEnv().cronSecret;
  if (!secret) return false;
  const header = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  return (
    header.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(header), Buffer.from(expected))
  );
}
