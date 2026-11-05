"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "../database.types";
import { publicEnv } from "@/lib/env";

let client: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function browserClient() {
  if (!client) {
    client = createBrowserClient<Database>(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey);
  }
  return client;
}
