import { describe, it, expect } from "vitest";
import {
  EMOTIONS,
  CORE_IDS,
  CORE_COLORS,
  BODY_LOCATIONS,
  isCoreId,
  getCore,
  getMiddle,
  getPrecise,
  isValidPath,
  emotionLabel,
  breadcrumb,
  pathKey,
  parsePathKey,
  type EmotionPath,
  type Label,
} from "@/lib/emotions";

const DASHES = new RegExp("[\\u2013\\u2014]");

function allLabels(): Label[] {
  const out: Label[] = [];
  for (const c of EMOTIONS) {
    out.push(c.label);
    for (const m of c.middle) {
      out.push(m.label);
      for (const p of m.precise) out.push(p.label);
    }
  }
  for (const b of BODY_LOCATIONS) out.push(b.label);
  return out;
}

describe("emotion wheel data", () => {
  it("has 7 cores in order with the exact colours", () => {
    expect(EMOTIONS.map((c) => [c.id, c.color])).toEqual([
      ["happy", "#EF9F27"],
      ["sad", "#378ADD"],
      ["angry", "#E24B4A"],
      ["fearful", "#D85A30"],
      ["bad", "#1D9E75"],
      ["surprised", "#7F77DD"],
      ["disgusted", "#888780"],
    ]);
    expect(CORE_IDS).toEqual(["happy", "sad", "angry", "fearful", "bad", "surprised", "disgusted"]);
    for (const c of EMOTIONS) expect(CORE_COLORS[c.id]).toBe(c.color);
  });

  it("has the expected middle counts per core", () => {
    expect(EMOTIONS.map((c) => c.middle.length)).toEqual([9, 6, 8, 6, 4, 4, 4]);
  });

  it("gives every middle exactly 2 precise emotions", () => {
    for (const c of EMOTIONS) for (const m of c.middle) expect(m.precise).toHaveLength(2);
  });

  it("has non-empty en and ar labels everywhere, without dashes", () => {
    for (const l of allLabels()) {
      expect(l.en.trim().length).toBeGreaterThan(0);
      expect(l.ar.trim().length).toBeGreaterThan(0);
      expect(DASHES.test(l.en)).toBe(false);
      expect(DASHES.test(l.ar)).toBe(false);
    }
  });

  it("uses kebab-case ids that are unique within their parent", () => {
    const kebab = /^[a-z0-9]+(-[a-z0-9]+)*$/;
    const coreIds = EMOTIONS.map((c) => c.id);
    expect(new Set(coreIds).size).toBe(coreIds.length);
    for (const c of EMOTIONS) {
      const mids = c.middle.map((m) => m.id);
      expect(new Set(mids).size).toBe(mids.length);
      for (const m of c.middle) {
        expect(m.id).toMatch(kebab);
        const ps = m.precise.map((p) => p.id);
        expect(new Set(ps).size).toBe(ps.length);
        for (const id of ps) expect(id).toMatch(kebab);
      }
    }
    expect(getMiddle("angry", "let-down")?.label.en).toBe("Let down");
    expect(getPrecise("bad", "stressed", "out-of-control")?.label.en).toBe("Out of control");
  });

  it("lists body locations in order", () => {
    expect(BODY_LOCATIONS.map((b) => b.id)).toEqual([
      "head",
      "chest",
      "stomach",
      "shoulders",
      "hands",
      "nowhere",
    ]);
    expect(BODY_LOCATIONS[5].label.en).toBe("Nowhere specific");
  });
});

describe("lookups and validation", () => {
  it("recognises core ids", () => {
    expect(isCoreId("happy")).toBe(true);
    expect(isCoreId("joy")).toBe(false);
    expect(isCoreId(3)).toBe(false);
    expect(isCoreId(null)).toBe(false);
    expect(getCore("sad").label.en).toBe("Sad");
  });

  it("finds middle and precise emotions only within their parent", () => {
    expect(getMiddle("happy", "proud")?.label.en).toBe("Proud");
    expect(getMiddle("sad", "proud")).toBeUndefined();
    expect(getPrecise("happy", "playful", "free")?.label.en).toBe("Free");
    expect(getPrecise("happy", "content", "free")?.label.en).toBe("Free");
    expect(getPrecise("happy", "proud", "free")).toBeUndefined();
  });

  it("validates paths", () => {
    expect(isValidPath({ core: "angry" })).toBe(true);
    expect(isValidPath({ core: "angry", middle: "frustrated" })).toBe(true);
    expect(isValidPath({ core: "angry", middle: "frustrated", precise: "annoyed" })).toBe(true);
    expect(isValidPath({ core: "angry", middle: null, precise: null })).toBe(true);
    expect(isValidPath({ core: "angry", middle: "lonely" })).toBe(false);
    expect(isValidPath({ core: "angry", middle: "frustrated", precise: "betrayed" })).toBe(false);
    expect(isValidPath({ core: "angry", precise: "annoyed" })).toBe(false);
    expect(isValidPath({ core: "nope" as never })).toBe(false);
  });
});

describe("labels and keys", () => {
  const full: EmotionPath = { core: "angry", middle: "frustrated", precise: "annoyed" };

  it("builds breadcrumbs", () => {
    expect(breadcrumb({ core: "angry", middle: "frustrated" }, "en")).toEqual(["Angry", "Frustrated"]);
    expect(breadcrumb(full, "en")).toEqual(["Angry", "Frustrated", "Annoyed"]);
    expect(breadcrumb({ core: "happy" }, "ar")).toEqual(["سعيد"]);
    expect(breadcrumb(full, "ar")).toHaveLength(3);
  });

  it("returns the most specific label", () => {
    expect(emotionLabel({ core: "angry" }, "en")).toBe("Angry");
    expect(emotionLabel({ core: "angry", middle: "frustrated" }, "en")).toBe("Frustrated");
    expect(emotionLabel(full, "en")).toBe("Annoyed");
    expect(emotionLabel({ core: "sad" }, "ar")).toBe("حزين");
  });

  it("round trips path keys", () => {
    expect(pathKey(full)).toBe("angry/frustrated/annoyed");
    expect(pathKey({ core: "angry", middle: "frustrated" })).toBe("angry/frustrated");
    expect(pathKey({ core: "angry", middle: null, precise: null })).toBe("angry");
    expect(pathKey({ core: "bad", middle: "stressed", precise: "out-of-control" })).toBe(
      "bad/stressed/out-of-control",
    );

    for (const c of EMOTIONS) {
      const paths: EmotionPath[] = [{ core: c.id }];
      for (const m of c.middle) {
        paths.push({ core: c.id, middle: m.id });
        for (const p of m.precise) paths.push({ core: c.id, middle: m.id, precise: p.id });
      }
      for (const path of paths) {
        const parsed = parsePathKey(pathKey(path));
        expect(parsed).not.toBeNull();
        expect(parsed!.core).toBe(path.core);
        expect(parsed!.middle ?? null).toBe(path.middle ?? null);
        expect(parsed!.precise ?? null).toBe(path.precise ?? null);
        expect(pathKey(parsed!)).toBe(pathKey(path));
      }
    }
  });

  it("rejects bad keys", () => {
    expect(parsePathKey("")).toBeNull();
    expect(parsePathKey("joy")).toBeNull();
    expect(parsePathKey("angry/lonely")).toBeNull();
    expect(parsePathKey("angry//annoyed")).toBeNull();
    expect(parsePathKey("angry/frustrated/annoyed/extra")).toBeNull();
  });
});
