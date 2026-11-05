import { describe, expect, it } from "vitest";
import { dictionaries, fmt } from "@/lib/i18n";

function flatten(o: unknown, prefix = ""): Record<string, string> {
  const out: Record<string, string> = {};
  if (typeof o === "string") out[prefix] = o;
  else if (Array.isArray(o)) o.forEach((v, i) => Object.assign(out, flatten(v, `${prefix}[${i}]`)));
  else if (o && typeof o === "object")
    for (const [k, v] of Object.entries(o)) Object.assign(out, flatten(v, prefix ? `${prefix}.${k}` : k));
  return out;
}

const DASH = new RegExp("[\\u2013\\u2014]");

describe("i18n", () => {
  const en = flatten(dictionaries.en);
  const ar = flatten(dictionaries.ar);

  it("has the same keys in English and Arabic", () => {
    expect(Object.keys(ar).sort()).toEqual(Object.keys(en).sort());
  });

  it("has no empty strings, em dashes or exclamation marks", () => {
    for (const [k, v] of Object.entries({ ...en, ...Object.fromEntries(Object.entries(ar).map(([a, b]) => [`ar.${a}`, b])) })) {
      expect(v.trim(), k).not.toBe("");
      expect(DASH.test(v), k).toBe(false);
      expect(v.includes("!"), k).toBe(false);
    }
  });

  it("keeps the same placeholders in both languages", () => {
    for (const k of Object.keys(en)) {
      const ph = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort();
      expect(ph(ar[k]), k).toEqual(ph(en[k]));
    }
  });

  it("formats placeholders", () => {
    expect(fmt("{n} days", { n: 3 })).toBe("3 days");
    expect(fmt("{a} {b}", { a: "x" })).toBe("x {b}");
  });

  it("never uses guilt in notification copy", () => {
    const all = [...dictionaries.en.notifications.reminders, ...dictionaries.en.notifications.nudges].join(" ").toLowerCase();
    for (const w of ["lose", "lost", "break", "fail", "miss", "should"]) expect(all.includes(w), w).toBe(false);
  });
});
