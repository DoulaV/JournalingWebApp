// Feelings wheel data and helpers. Three rings: core, middle, precise.
// IDs are kebab-case slugs of the English word and are unique within their parent only.

export type Lang = "en" | "ar";
export type CoreId = "happy" | "sad" | "angry" | "fearful" | "bad" | "surprised" | "disgusted";
export interface Label {
  en: string;
  ar: string;
}
export interface PreciseEmotion {
  id: string;
  label: Label;
}
export interface MiddleEmotion {
  id: string;
  label: Label;
  precise: PreciseEmotion[];
}
export interface CoreEmotion {
  id: CoreId;
  label: Label;
  color: string;
  middle: MiddleEmotion[];
}
export interface EmotionPath {
  core: CoreId;
  middle?: string | null;
  precise?: string | null;
}

function slug(en: string): string {
  return en
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

type Word = [en: string, ar: string];

function mid(word: Word, precise: [Word, Word]): MiddleEmotion {
  return {
    id: slug(word[0]),
    label: { en: word[0], ar: word[1] },
    precise: precise.map(([en, ar]) => ({ id: slug(en), label: { en, ar } })),
  };
}

function core(id: CoreId, label: Word, color: string, middle: MiddleEmotion[]): CoreEmotion {
  return { id, label: { en: label[0], ar: label[1] }, color, middle };
}

export const EMOTIONS: CoreEmotion[] = [
  core("happy", ["Happy", "سعيد"], "#EF9F27", [
    mid(["Content", "راضٍ"], [["Free", "حر"], ["Joyful", "مبتهج"]]),
    mid(["Proud", "فخور"], [["Successful", "ناجح"], ["Confident", "واثق بنفسي"]]),
    mid(["Peaceful", "مطمئن"], [["Loving", "محب"], ["Thankful", "ممتن"]]),
    mid(["Optimistic", "متفائل"], [["Hopeful", "مفعم بالأمل"], ["Inspired", "ملهَم"]]),
    mid(["Interested", "مهتم"], [["Curious", "شغوف"], ["Inquisitive", "متسائل"]]),
    mid(["Accepted", "مقبول"], [["Respected", "محترَم"], ["Valued", "مقدَّر"]]),
    mid(["Powerful", "قوي"], [["Courageous", "شجاع"], ["Creative", "مبدع"]]),
    mid(["Trusting", "واثق بمن حولي"], [["Sensitive", "مرهف"], ["Intimate", "قريب"]]),
    mid(["Playful", "مرِح"], [["Cheeky", "مشاكس"], ["Free", "حر"]]),
  ]),
  core("sad", ["Sad", "حزين"], "#378ADD", [
    mid(["Lonely", "وحيد"], [["Isolated", "معزول"], ["Abandoned", "متروك"]]),
    mid(["Hurt", "مجروح"], [["Disappointed", "خائب الأمل"], ["Embarrassed", "محرج"]]),
    mid(["Guilty", "مذنب"], [["Ashamed", "خجِل من نفسي"], ["Remorseful", "نادم"]]),
    mid(["Depressed", "مكتئب"], [["Empty", "فارغ"], ["Inferior", "أقل من الآخرين"]]),
    mid(["Vulnerable", "هش"], [["Victimised", "مظلوم"], ["Fragile", "منكسر"]]),
    mid(["Despair", "يائس"], [["Grief", "مكلوم"], ["Powerless", "عاجز"]]),
  ]),
  core("angry", ["Angry", "غاضب"], "#E24B4A", [
    mid(["Frustrated", "محبَط"], [["Annoyed", "منزعج"], ["Infuriated", "مستشيط غضبًا"]]),
    mid(["Let down", "مخذول"], [["Resentful", "مستاء"], ["Betrayed", "مخدوع"]]),
    mid(["Humiliated", "مُهان"], [["Ridiculed", "موضع سخرية"], ["Disrespected", "غير محترَم"]]),
    mid(["Bitter", "ممتعض"], [["Violated", "منتهَك"], ["Indignant", "ساخط"]]),
    mid(["Mad", "حانق"], [["Jealous", "غيور"], ["Furious", "ثائر"]]),
    mid(["Aggressive", "عدواني"], [["Hostile", "عدائي"], ["Provoked", "مستفَز"]]),
    mid(["Distant", "منفصل"], [["Numb", "متبلّد"], ["Withdrawn", "منطوٍ"]]),
    mid(["Critical", "ناقد"], [["Dismissive", "مستخِف"], ["Sceptical", "متشكك"]]),
  ]),
  core("fearful", ["Fearful", "خائف"], "#D85A30", [
    mid(["Anxious", "قلق"], [["Worried", "مهموم"], ["Overwhelmed", "مثقَل"]]),
    mid(["Insecure", "مهزوز"], [["Inadequate", "غير كافٍ"], ["Inferior", "أقل من الآخرين"]]),
    mid(["Scared", "مرتعب"], [["Frightened", "مذعور"], ["Helpless", "قليل الحيلة"]]),
    mid(["Rejected", "مرفوض"], [["Excluded", "مستبعَد"], ["Persecuted", "مضطهَد"]]),
    mid(["Threatened", "مهدَّد"], [["Nervous", "متوتر"], ["Exposed", "مكشوف"]]),
    mid(["Weak", "ضعيف"], [["Worthless", "بلا قيمة"], ["Insignificant", "غير مهم"]]),
  ]),
  core("bad", ["Bad", "سيئ"], "#1D9E75", [
    mid(["Stressed", "مضغوط"], [["Overwhelmed", "مثقَل"], ["Out of control", "فاقد السيطرة"]]),
    mid(["Tired", "متعب"], [["Sleepy", "نعسان"], ["Unfocused", "مشتت"]]),
    mid(["Busy", "مشغول"], [["Pressured", "تحت الضغط"], ["Rushed", "مستعجل"]]),
    mid(["Bored", "ضجِر"], [["Indifferent", "غير مبالٍ"], ["Apathetic", "فاتر"]]),
  ]),
  core("surprised", ["Surprised", "مندهش"], "#7F77DD", [
    mid(["Excited", "متحمس"], [["Eager", "متلهف"], ["Energetic", "نشيط"]]),
    mid(["Amazed", "مذهول"], [["Astonished", "مشدوه"], ["Awe", "مبهور"]]),
    mid(["Confused", "مرتبك"], [["Perplexed", "حائر"], ["Disillusioned", "خائب الظن"]]),
    mid(["Startled", "متفاجئ"], [["Shocked", "مصدوم"], ["Dismayed", "واجم"]]),
  ]),
  core("disgusted", ["Disgusted", "مشمئز"], "#888780", [
    mid(["Disapproving", "مستنكِر"], [["Judgmental", "متحامل"], ["Embarrassed", "محرج"]]),
    mid(["Disappointed", "خائب الأمل"], [["Appalled", "مستهجِن"], ["Revolted", "متقزز"]]),
    mid(["Awful", "متكدّر"], [["Nauseated", "غثيان"], ["Detestable", "بغيض"]]),
    mid(["Repelled", "نافر"], [["Horrified", "مروَّع"], ["Hesitant", "متردد"]]),
  ]),
];

export const CORE_IDS: CoreId[] = EMOTIONS.map((c) => c.id);

export const CORE_COLORS: Record<CoreId, string> = Object.fromEntries(
  EMOTIONS.map((c) => [c.id, c.color]),
) as Record<CoreId, string>;

export function isCoreId(v: unknown): v is CoreId {
  return typeof v === "string" && (CORE_IDS as string[]).includes(v);
}

export function getCore(id: CoreId): CoreEmotion {
  const found = EMOTIONS.find((c) => c.id === id);
  if (!found) throw new Error(`Unknown core emotion: ${String(id)}`);
  return found;
}

export function getMiddle(core: CoreId, middleId: string): MiddleEmotion | undefined {
  if (!isCoreId(core)) return undefined;
  return getCore(core).middle.find((m) => m.id === middleId);
}

export function getPrecise(
  core: CoreId,
  middleId: string,
  preciseId: string,
): PreciseEmotion | undefined {
  return getMiddle(core, middleId)?.precise.find((p) => p.id === preciseId);
}

export function isValidPath(p: EmotionPath): boolean {
  if (!p || !isCoreId(p.core)) return false;
  if (p.middle == null || p.middle === "") {
    return p.precise == null || p.precise === "";
  }
  const middle = getMiddle(p.core, p.middle);
  if (!middle) return false;
  if (p.precise == null || p.precise === "") return true;
  return middle.precise.some((x) => x.id === p.precise);
}

function labels(p: EmotionPath): Label[] {
  if (!isCoreId(p.core)) return [];
  const out: Label[] = [getCore(p.core).label];
  if (!p.middle) return out;
  const middle = getMiddle(p.core, p.middle);
  if (!middle) return out;
  out.push(middle.label);
  if (!p.precise) return out;
  const precise = middle.precise.find((x) => x.id === p.precise);
  if (precise) out.push(precise.label);
  return out;
}

export function emotionLabel(p: EmotionPath, lang: Lang): string {
  const ls = labels(p);
  return ls.length ? ls[ls.length - 1][lang] : "";
}

export function breadcrumb(p: EmotionPath, lang: Lang): string[] {
  return labels(p).map((l) => l[lang]);
}

export function pathKey(p: EmotionPath): string {
  const parts: string[] = [p.core];
  if (p.middle) {
    parts.push(p.middle);
    if (p.precise) parts.push(p.precise);
  }
  return parts.join("/");
}

export function parsePathKey(key: string): EmotionPath | null {
  if (typeof key !== "string" || key === "") return null;
  const parts = key.split("/");
  if (parts.length > 3 || parts.some((x) => x === "")) return null;
  const [c, middle, precise] = parts;
  if (!isCoreId(c)) return null;
  const path: EmotionPath = { core: c, middle: middle ?? null, precise: precise ?? null };
  return isValidPath(path) ? path : null;
}

export const BODY_LOCATIONS: {
  id: "head" | "chest" | "stomach" | "shoulders" | "hands" | "nowhere";
  label: Label;
}[] = [
  { id: "head", label: { en: "Head", ar: "الرأس" } },
  { id: "chest", label: { en: "Chest", ar: "الصدر" } },
  { id: "stomach", label: { en: "Stomach", ar: "المعدة" } },
  { id: "shoulders", label: { en: "Shoulders", ar: "الكتفان" } },
  { id: "hands", label: { en: "Hands", ar: "اليدان" } },
  { id: "nowhere", label: { en: "Nowhere specific", ar: "لا مكان محدد" } },
];
