import { afterEach, describe, expect, it } from "vitest";
import { formatNumber, LOCALES, resolveLocale, setLocale, t, type Locale } from "./index";
import { de } from "./locales/de";
import { en } from "./locales/en";
import { es } from "./locales/es";
import { fr } from "./locales/fr";

const CATALOGS: Record<Locale, Readonly<Record<string, string>>> = { en, de, fr, es };

function placeholders(message: string): string[] {
  return [...message.matchAll(/\{(\w+)\}/g)].map((m) => m[1] ?? "").sort();
}

afterEach(() => setLocale("en"));

describe("t", () => {
  it("interpolates and falls back to English", () => {
    setLocale("de");
    expect(t("common.somethingWentWrong")).toBe("Etwas ist schiefgelaufen.");
  });

  it("picks the plural form without Intl.PluralRules, which iOS Hermes lacks", () => {
    expect(t("common.climbCount", { count: 1 })).toBe("1 climb");
    expect(t("common.climbCount", { count: 3 })).toBe("3 climbs");
    setLocale("fr");
    expect(t("common.climbCount", { count: 0 })).toBe(
      fr["common.climbCount_one"].replace("{count}", "0")
    );
    expect(t("common.climbCount", { count: 2 })).toBe(
      fr["common.climbCount_other"].replace("{count}", "2")
    );
  });

  it("resolves Accept-Language and device tags", () => {
    expect(resolveLocale("de-DE,de;q=0.9,en;q=0.8")).toBe("de");
    expect(resolveLocale("pt-BR,es;q=0.5")).toBe("es");
    expect(resolveLocale("ja")).toBe("en");
    expect(resolveLocale(undefined)).toBe("en");
  });

  it("formats numbers per locale", () => {
    setLocale("de");
    expect(formatNumber(4.5)).toBe("4,5");
  });
});

describe("catalog parity", () => {
  for (const locale of LOCALES.filter((l) => l !== "en")) {
    it(`${locale} has every English key with the same placeholders`, () => {
      const missing = Object.keys(en).filter((k) => !(k in CATALOGS[locale]));
      expect(missing).toEqual([]);
      for (const [key, message] of Object.entries(en)) {
        expect(placeholders(CATALOGS[locale][key] ?? ""), key).toEqual(placeholders(message));
      }
    });
  }
});
