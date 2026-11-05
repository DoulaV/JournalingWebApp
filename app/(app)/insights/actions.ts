"use server";

import { reflectOnWeek } from "@/lib/data/reflection";

export async function reflectAction() {
  return reflectOnWeek();
}
