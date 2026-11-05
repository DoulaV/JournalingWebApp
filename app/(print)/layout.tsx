import { requireUser } from "@/lib/data/auth";

export default async function PrintLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  return <main className="mx-auto max-w-3xl px-6 py-8 print:max-w-none print:p-0">{children}</main>;
}
