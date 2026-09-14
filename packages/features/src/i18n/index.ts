import { en } from "./locales/en";
import { de } from "./locales/de";
import { es } from "./locales/es";
import { fr } from "./locales/fr";

export const LOCALES = ["en", "de", "fr", "es"] as const;
export type Locale = (typeof LOCALES)[number];

type PluralCategory = "zero" | "one" | "two" | "few" | "many" | "other";
type StripPlural<K> = K extends `${infer Base}_other`
  ? Base
  : K extends `${string}_${PluralCategory}`
    ? never
    : K;
export type MessageKey = StripPlural<keyof typeof en>;
export type Vars = Record<string, string | number>;

type Catalog = Readonly<Record<string, string>>;
const CATALOGS: Record<Locale, Catalog> = { en, de, fr, es };

let resolver: () => Locale = () => "en";

export function setLocaleResolver(fn: () => Locale): void {
  resolver = fn;
}

export function setLocale(locale: Locale): void {
  setLocaleResolver(() => locale);
}

export function getLocale(): Locale {
  return resolver();
}

export function resolveLocale(tag: string | null | undefined): Locale {
  if (!tag) return "en";
  for (const part of tag.split(",")) {
    const lang = part.trim().split(";")[0]?.split("-")[0]?.toLowerCase();
    const match = LOCALES.find((l) => l === lang);
    if (match !== undefined) return match;
  }
  return "en";
}

function pluralCategory(locale: Locale, n: number): "one" | "other" {
  const one = locale === "fr" ? n === 0 || n === 1 : n === 1;
  return one ? "one" : "other";
}

function lookup(locale: Locale, key: string, count: number | undefined): string | undefined {
  const catalog = CATALOGS[locale];
  if (count === undefined) return catalog[key];
  return catalog[`${key}_${pluralCategory(locale, count)}`] ?? catalog[`${key}_other`];
}

export function t(key: MessageKey, vars?: Vars): string {
  const count = vars?.count;
  const n = typeof count === "number" ? count : undefined;
  const message = lookup(getLocale(), key, n) ?? lookup("en", key, n) ?? key;
  if (vars === undefined) return message;
  return message.replace(/\{(\w+)\}/g, (whole, name: string) =>
    name in vars ? String(vars[name]) : whole
  );
}

export function formatDate(date: Date, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(getLocale(), options).format(date);
}

export function formatNumber(n: number, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(getLocale(), options).format(n);
}
