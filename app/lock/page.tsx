import { redirect } from "next/navigation";
import { isLocked, requireUserAllowLocked } from "@/lib/data/auth";
import { getPrefs } from "@/lib/data/prefs";
import { getDict } from "@/lib/i18n";
import { LockScreen } from "@/components/shell/lock-screen";

export const metadata = { title: "Locked" };

export default async function LockPage() {
  const user = await requireUserAllowLocked();
  if (!(await isLocked(user.id))) redirect("/today");
  const { lang } = await getPrefs();
  return <LockScreen t={getDict(lang).lock} />;
}
