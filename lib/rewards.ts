import type { Dict } from "./i18n";

export type RewardId = "theme" | "recap" | "letters" | "lookBack" | "yearReview";

export const REWARDS: { at: number; id: RewardId; href: string }[] = [
  { at: 7, id: "theme", href: "/settings#appearance" },
  { at: 30, id: "recap", href: "/insights#recap" },
  { at: 50, id: "letters", href: "/letters" },
  { at: 100, id: "lookBack", href: "/milestones#look-back" },
  { at: 365, id: "yearReview", href: "/milestones#year" },
];

export function rewardFor(milestone: number) {
  return REWARDS.find((r) => r.at === milestone) ?? null;
}

export function isUnlocked(id: RewardId, longest: number): boolean {
  const r = REWARDS.find((x) => x.id === id);
  return Boolean(r && longest >= r.at);
}

export function rewardLabel(id: RewardId, t: Dict["rewards"]): string {
  return {
    theme: t.theme,
    recap: t.recap,
    letters: t.letters,
    lookBack: t.lookBack,
    yearReview: t.yearReview,
  }[id];
}
