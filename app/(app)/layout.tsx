import { requireUser } from "@/lib/data/auth";
import { getProfileRow, toProfile } from "@/lib/data/profile";
import { getDict } from "@/lib/i18n";
import { Nav, MobileQuickLinks } from "@/components/shell/nav";
import { ActivityWatcher } from "@/components/shell/lock-screen";
import { PwaClient } from "@/components/shell/pwa-client";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  const profile = toProfile(await getProfileRow());
  const t = getDict(profile.language);

  return (
    <div className="flex min-h-dvh">
      <a
        href="#main"
        className="focus:bg-surface sr-only focus:not-sr-only focus:fixed focus:start-2 focus:top-2 focus:z-50 focus:rounded-lg focus:p-2"
      >
        {profile.language === "ar" ? "انتقل إلى المحتوى" : "Skip to content"}
      </a>
      <Nav t={t} />
      {profile.hasPin && <ActivityWatcher timeoutMinutes={profile.lockTimeoutMinutes} />}
      <main
        id="main"
        className="mx-auto w-full max-w-3xl flex-1 px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-28 sm:px-6 md:pt-10 md:pb-12"
      >
        <MobileQuickLinks t={t} />
        {children}
      </main>
      <PwaClient t={t} />
    </div>
  );
}
