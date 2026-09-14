import { LOCALES, resolveLocale, type Locale } from "@sendtally/features/i18n";

export function landingLocale(pathname: string): Locale | undefined {
  const first = pathname.split("/")[1];
  return LOCALES.find((l) => l !== "en" && l === first);
}

export function requestLocale(request: Request): Locale {
  return (
    landingLocale(new URL(request.url).pathname) ??
    resolveLocale(request.headers.get("accept-language"))
  );
}
