import type { Lang } from "./emotions";

/** Default life areas, translated for display. Custom tags show as typed. */
export const DEFAULT_TAG_LABELS: Record<string, { en: string; ar: string }> = {
  work: { en: "Work", ar: "العمل" },
  family: { en: "Family", ar: "العائلة" },
  health: { en: "Health", ar: "الصحة" },
  money: { en: "Money", ar: "المال" },
  relationships: { en: "Relationships", ar: "العلاقات" },
  friends: { en: "Friends", ar: "الأصدقاء" },
  self: { en: "Self", ar: "الذات" },
  ideas: { en: "Ideas", ar: "الأفكار" },
  gratitude: { en: "Gratitude", ar: "الامتنان" },
};

export function tagLabel(name: string, lang: Lang): string {
  return DEFAULT_TAG_LABELS[name]?.[lang] ?? name;
}
