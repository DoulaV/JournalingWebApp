import { requireUser } from "@/lib/data/auth";
import { getProfileRow, toProfile } from "@/lib/data/profile";
import { getDict } from "@/lib/i18n";
import { Nav, MobileQuickLinks } from "@/components/shell/nav";
import { LockGate } from "@/components/shell/lock-gate";
import { PwaClient } from "@/components/shell/pwa-client";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  const profile = toProfile(await getProfileRow());
  const t = getDict(profile.language);

  return (
    <div className="flex min-h-dvh">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:start-2 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-surface focus:p-2">
        {profile.language === "ar" ? "انتقل إلى المحتوى" : "Skip to content"}
      </a>
      <Nav t={t} />
      <LockGate hasPin={profile.hasPin} timeoutMinutes={profile.lockTimeoutMinutes} t={t.lock}>
        <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-28 sm:px-6 md:pb-12 md:pt-10">
          <MobileQuickLinks t={t} />
          {children}
        </main>
      </LockGate>
      <PwaClient t={t} />
    </div>
  );
}
