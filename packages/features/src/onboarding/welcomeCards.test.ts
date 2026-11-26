import { afterEach, describe, expect, it } from "vitest";
import { setLocale, type Locale } from "../i18n";
import { DEFAULT_GRADE_SCALES } from "../settings/transforms";
import { welcomeCards } from "./welcomeCards";

const V = DEFAULT_GRADE_SCALES;

afterEach(() => setLocale("en"));

const FORBIDDEN: Record<Locale, RegExp> = {
  en: /\byours?\b|\bfree\b|trial|price|member|subscri|\bcard\b|board climbing|sync/i,
  de: /\bdein|kostenlos|gratis|test|preis|mitglied|abo|karte|synchron/i,
  fr: /\b(ton|ta|tes|votre|vos)\b|gratuit|essai|prix|membre|abonn|carte|synchro/i,
  es: /\b(tu|tus|su|sus)\b|gratis|prueba|precio|miembro|suscri|tarjeta|sincroni/i,
};

describe("welcomeCards", () => {
  it("has the six cards in order, with the board's English", () => {
    const { cards } = welcomeCards("lb", V);
    expect(cards.map((c) => c.key)).toEqual([
      "blocks",
      "log",
      "workouts",
      "hangboard",
      "metrics",
      "load",
    ]);
    expect(cards.map((c) => c.title)).toEqual([
      "Custom training blocks",
      "A climbing log",
      "Custom workouts",
      "Hangboard workouts",
      "Exercise metrics",
      "Load tracking",
    ]);
    expect(cards[0]?.body).toBe("Schedule recurring workouts and shape each week of the block.");
  });

  it.each(Object.keys(FORBIDDEN) as Locale[])(
    "in %s, no title or body repeats another and none says your, price, trial or membership",
    (locale) => {
      setLocale(locale);
      const texts = welcomeCards("lb", V).cards.flatMap((c) => [c.title, c.body]);
      expect(new Set(texts).size).toBe(12);
      for (const text of texts) expect(text).not.toMatch(FORBIDDEN[locale]);
    }
  );

  it("authors its sample weights per unit, never converting one from the other", () => {
    const lb = welcomeCards("lb", V);
    const kg = welcomeCards("kg", V);
    expect(lb.exercises.map((e) => e.work).slice(0, 3)).toEqual([
      "4 × 3 · +45 lb",
      "3 × 5 · 135 lb",
      "3 × 5 · 225 lb",
    ]);
    expect(kg.exercises.map((e) => e.work).slice(0, 3)).toEqual([
      "4 × 3 · +20 kg",
      "3 × 5 · 60 kg",
      "3 × 5 · 100 kg",
    ]);
    expect(lb.e1rm.sessions.at(-1)?.e1rmKg).toBeCloseTo(285 * 0.45359237, 3);
    expect(kg.e1rm.sessions.at(-1)?.e1rmKg).toBe(130);
    expect(lb.e1rm.sessions).toHaveLength(8);
  });

  it("puts the rest before each exercise but the first", () => {
    expect(welcomeCards("lb", V).exercises.map((e) => e.restBeforeS)).toEqual([
      0, 120, 180, 180, 60, 60,
    ]);
  });

  it("stops the timer mid-set on the fourth hang of set two", () => {
    const { timer } = welcomeCards("lb", V);
    expect(timer.label).toBe("Hang");
    expect(timer.setLine).toBe("Set 2 of 5");
    expect(timer.run.marks).toEqual(["ok", "ok", "ok"]);
    expect(timer.grip).toMatch(/^Half crimp · 20\smm$/);
  });

  it("draws an average week over twelve weeks of load, as Stats does at 3 months", () => {
    const { load } = welcomeCards("lb", V);
    expect(load.bars).toHaveLength(12);
    expect(load.headline).toBe("410");
    expect(load.sentence).toBe("Up 12% on the 3 months before.");
    expect(load.ticks).toEqual(["Sep 7", "Oct 12", "Nov 23"]);
  });

  it("shows the log's grades in the climber's scale", () => {
    expect(welcomeCards("lb", V).climbs.map((c) => c.gradeLabel)).toEqual(["V5", "V4", "V6", "V3"]);
    const font = welcomeCards("lb", { ...V, boulder: "font" }).climbs.map((c) => c.gradeLabel);
    expect(font).not.toContain("V5");
    expect(welcomeCards("lb", V).climbs[0]?.meta).toBe("Home gym · Nov 21");
  });
});
