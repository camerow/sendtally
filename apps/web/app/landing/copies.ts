import type { Locale } from "@sendtally/features/i18n";
import { COPY, type LandingCopy } from "./copy";
import { COPY_DE } from "./copy.de";
import { COPY_ES } from "./copy.es";
import { COPY_FR } from "./copy.fr";

export const COPIES: Record<Locale, LandingCopy> = {
  en: COPY,
  de: COPY_DE,
  fr: COPY_FR,
  es: COPY_ES,
};
