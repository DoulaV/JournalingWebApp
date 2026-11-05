import { redirect } from "next/navigation";
import { requireUser } from "@/lib/data/auth";
import { getProfileRow } from "@/lib/data/profile";
import { isUnlocked } from "@/lib/pin";

export default async function PrintLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  const profile = await getProfileRow();
  if (profile.pin_hash && !(await isUnlocked())) redirect("/today");
  return <main className="mx-auto max-w-3xl px-6 py-8 print:max-w-none print:p-0">{children}</main>;
}
