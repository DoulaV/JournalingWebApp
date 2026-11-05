import { describe, it, expect } from "vitest";
import { EMOTIONS, CORE_IDS, getMiddle } from "@/lib/emotions";
import {
  PROMPTS,
  RITUAL_PROMPTS,
  WEEKLY_REVIEW_PROMPT,
  NO_REPEAT_DAYS,
  getPrompt,
  pickPrompt,
  type PromptHistoryItem,
} from "@/lib/prompts";

const DASHES = new RegExp("[\\u2013\\u2014]");
const TODAY = "2026-03-20";

function daysAgo(n: number): string {
  const d = new Date(Date.UTC(2026, 2, 20) - n * 86400000);
  return d.toISOString().slice(0, 10);
}

function showAll(ids: string[], n: number): PromptHistoryItem[] {
  return ids.map((promptId) => ({ promptId, shownOn: daysAgo(n) }));
}

const ids = (pred: (p: (typeof PROMPTS)[number]) => boolean) => PROMPTS.filter(pred).map((p) => p.id);

describe("prompt content", () => {
  it("has enough prompts per core and general", () => {
    for (const core of CORE_IDS) {
      expect(PROMPTS.filter((p) => p.category === core && !p.middle).length).toBeGreaterThanOrEqual(8);
    }
    expect(PROMPTS.filter((p) => p.category === "general").length).toBeGreaterThanOrEqual(15);
  });

  it("has unique kebab-case ids", () => {
    const all = [...PROMPTS.map((p) => p.id), WEEKLY_REVIEW_PROMPT.id];
    expect(new Set(all).size).toBe(all.length);
    for (const id of all) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it("has non-empty en and ar text without dashes", () => {
    const texts = [
      ...PROMPTS.flatMap((p) => [p.en, p.ar]),
      WEEKLY_REVIEW_PROMPT.en,
      WEEKLY_REVIEW_PROMPT.ar,
      RITUAL_PROMPTS.morning.en,
      RITUAL_PROMPTS.morning.ar,
      RITUAL_PROMPTS.evening.en,
      RITUAL_PROMPTS.evening.ar,
    ];
    for (const t of texts) {
      expect(t.trim().length).toBeGreaterThan(0);
      expect(DASHES.test(t)).toBe(false);
      expect(t.includes("!")).toBe(false);
    }
  });

  it("only uses middle ids that belong to the prompt's core", () => {
    for (const p of PROMPTS) {
      if (!p.middle) continue;
      expect(CORE_IDS).toContain(p.category);
      expect(getMiddle(p.category as (typeof CORE_IDS)[number], p.middle)).toBeDefined();
    }
    expect(EMOTIONS.length).toBe(7);
  });

  it("includes the four example middle prompts", () => {
    const has = (category: string, middle: string, en: string) =>
      PROMPTS.some((p) => p.category === category && p.middle === middle && p.en === en);
    expect(has("angry", "frustrated", "What did you need that you didn't get?")).toBe(true);
    expect(has("happy", "proud", "What did you do that made this possible?")).toBe(true);
    expect(has("fearful", "anxious", "What's the worst case, and how likely is it really?")).toBe(true);
    expect(has("bad", "tired", "What drained you today, and what could refill you?")).toBe(true);
  });

  it("exposes ritual and weekly prompts", () => {
    expect(RITUAL_PROMPTS.morning.en).toBe("How do I want to feel today?");
    expect(RITUAL_PROMPTS.evening.en).toBe("How did I actually feel today?");
    expect(WEEKLY_REVIEW_PROMPT).toMatchObject({
      id: "weekly-pattern",
      category: "weekly",
      en: "What pattern did you notice this week?",
    });
    expect(getPrompt("weekly-pattern")).toBe(WEEKLY_REVIEW_PROMPT);
    expect(getPrompt("angry-frustrated-need")?.middle).toBe("frustrated");
    expect(getPrompt("missing")).toBeUndefined();
    expect(NO_REPEAT_DAYS).toBe(14);
  });
});

describe("pickPrompt", () => {
  const zero = () => 0;

  it("prefers matching core and middle", () => {
    const p = pickPrompt({ core: "angry", middle: "frustrated", today: TODAY, history: [], random: zero });
    expect(p.category).toBe("angry");
    expect(p.middle).toBe("frustrated");
  });

  it("falls back to core prompts without a middle", () => {
    const p = pickPrompt({ core: "angry", middle: "mad", today: TODAY, history: [], random: zero });
    expect(p.category).toBe("angry");
    expect(p.middle).toBeUndefined();

    const q = pickPrompt({ core: "sad", today: TODAY, history: [], random: zero });
    expect(q.category).toBe("sad");
    expect(q.middle).toBeUndefined();
  });

  it("uses general prompts when no core is given", () => {
    for (let i = 0; i < 20; i++) {
      const p = pickPrompt({ today: TODAY, history: [], random: () => i / 20 });
      expect(p.category).toBe("general");
    }
    expect(pickPrompt({ core: null, today: TODAY, history: [], random: zero }).category).toBe("general");
  });

  it("excludes prompts shown 13 days ago and allows 14 days ago", () => {
    const middleIds = ids((p) => p.category === "angry" && p.middle === "frustrated");
    expect(middleIds.length).toBe(1);

    const recent = pickPrompt({
      core: "angry",
      middle: "frustrated",
      today: TODAY,
      history: showAll(middleIds, 13),
      random: zero,
    });
    expect(recent.middle).toBeUndefined();
    expect(recent.category).toBe("angry");

    const allowed = pickPrompt({
      core: "angry",
      middle: "frustrated",
      today: TODAY,
      history: showAll(middleIds, 14),
      random: zero,
    });
    expect(allowed.id).toBe(middleIds[0]);

    const today = pickPrompt({
      core: "angry",
      middle: "frustrated",
      today: TODAY,
      history: showAll(middleIds, 0),
      random: zero,
    });
    expect(today.id).not.toBe(middleIds[0]);
  });

  it("falls back to general when all core prompts are recent", () => {
    const coreIds = ids((p) => p.category === "fearful");
    const p = pickPrompt({ core: "fearful", middle: "anxious", today: TODAY, history: showAll(coreIds, 2), random: zero });
    expect(p.category).toBe("general");
  });

  it("returns the least recently shown prompt when everything is recent", () => {
    const oldest = "general-rest";
    const pool = ids((p) => (p.category === "bad" || p.category === "general") && p.id !== oldest);
    const history: PromptHistoryItem[] = pool.map((promptId, i) => ({
      promptId,
      shownOn: daysAgo(i % 10),
    }));
    history.push({ promptId: oldest, shownOn: daysAgo(13) });
    // An older showing of a prompt that was also shown recently does not make it the oldest.
    history.push({ promptId: "bad-heavy", shownOn: daysAgo(40) });
    const p = pickPrompt({ core: "bad", middle: "tired", today: TODAY, history, random: zero });
    expect(p.id).toBe(oldest);

    const noCore = pickPrompt({ today: TODAY, history, random: zero });
    expect(noCore.id).toBe(oldest);
  });

  it("is deterministic with an injected random and uses it uniformly", () => {
    const tier = ids((p) => p.category === "happy" && !p.middle);
    const seen = new Set<string>();
    for (let i = 0; i < tier.length; i++) {
      const r = (i + 0.5) / tier.length;
      const a = pickPrompt({ core: "happy", today: TODAY, history: [], random: () => r });
      const b = pickPrompt({ core: "happy", today: TODAY, history: [], random: () => r });
      expect(a.id).toBe(b.id);
      expect(a.id).toBe(tier[i]);
      seen.add(a.id);
    }
    expect(seen.size).toBe(tier.length);
    const edge = pickPrompt({ core: "happy", today: TODAY, history: [], random: () => 0.9999999 });
    expect(edge.id).toBe(tier[tier.length - 1]);
  });

  it("never returns the weekly prompt", () => {
    const everything = PROMPTS.map((p) => p.id);
    const cores = [null, ...CORE_IDS] as const;
    for (const core of cores) {
      for (let i = 0; i < 10; i++) {
        const fresh = pickPrompt({ core, today: TODAY, history: [], random: () => i / 10 });
        expect(fresh.category).not.toBe("weekly");
        const stale = pickPrompt({ core, today: TODAY, history: showAll(everything, 1), random: () => i / 10 });
        expect(stale.id).not.toBe(WEEKLY_REVIEW_PROMPT.id);
      }
    }
  });

  it("ignores history dated in the future or malformed", () => {
    const middleIds = ids((p) => p.category === "angry" && p.middle === "frustrated");
    const p = pickPrompt({
      core: "angry",
      middle: "frustrated",
      today: TODAY,
      history: [
        { promptId: middleIds[0], shownOn: "2026-03-25" },
        { promptId: middleIds[0], shownOn: "not a date" },
      ],
      random: zero,
    });
    expect(p.id).toBe(middleIds[0]);
  });
});
