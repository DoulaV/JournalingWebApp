import type { Metadata } from "next";
import { getProfile } from "@/lib/data/profile";
import { getStreak } from "@/lib/data/streaks";
import { getDict } from "@/lib/i18n";
import { features, publicEnv } from "@/lib/env";
import { isUnlocked as rewardUnlocked } from "@/lib/rewards";
import { localDate, addDays } from "@/lib/dates";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const [profile, streak] = await Promise.all([getProfile(), getStreak()]);
  const t = getDict(profile.language);
  const today = localDate(new Date(), profile.timezone);

  return (
    <div className="space-y-8">
      <h1 className="font-serif text-3xl font-semibold">{t.settings.title}</h1>
      <SettingsForm
        profile={profile}
        t={t}
        duskUnlocked={rewardUnlocked("theme", streak.longest)}
        transcriptionAvailable={features.transcriptionAvailable()}
        aiAvailable={features.aiReflectionAvailable()}
        pushConfigured={Boolean(publicEnv.vapidPublicKey) && features.pushAvailable()}
        vapidPublicKey={publicEnv.vapidPublicKey}
        defaultRange={{ from: addDays(today, -29), to: today }}
      />
    </div>
  );
}
