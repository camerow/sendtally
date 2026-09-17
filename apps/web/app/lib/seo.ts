import { LOCALES, type Locale } from "@sendtally/features/i18n";
import { POSTS } from "../blog/posts";

export const SITE_URL = "https://sendtally.com";

export function landingPath(locale: Locale): string {
  return locale === "en" ? "/" : `/${locale}`;
}

export const INDEXABLE_PATHS = [
  "/",
  "/de",
  "/fr",
  "/es",
  "/privacy",
  "/terms",
  "/support",
  "/blog",
  ...POSTS.map((post) => `/blog/${post.slug}`),
];

const OG_LOCALES: Record<Locale, string> = { en: "en_US", de: "de_DE", fr: "fr_FR", es: "es_ES" };

type PageMeta = {
  title: string;
  description?: string;
  path: string;
  noindex?: boolean;
  locale?: Locale;
  hreflang?: boolean;
};

export function pageMeta({
  title,
  description,
  path,
  noindex,
  locale = "en",
  hreflang = false,
}: PageMeta): Array<Record<string, string>> {
  const url = `${SITE_URL}${path}`;
  const image = `${SITE_URL}/og.jpg`;
  const tags: Array<Record<string, string>> = [
    { title },
    { property: "og:title", content: title },
    { property: "og:type", content: "website" },
    { property: "og:url", content: url },
    { property: "og:site_name", content: "sendtally" },
    { property: "og:image", content: image },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    {
      property: "og:image:alt",
      content: "sendtally - track your climbing, see the trends",
    },
    { property: "og:locale", content: OG_LOCALES[locale] },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:image", content: image },
    {
      name: "twitter:image:alt",
      content: "sendtally - track your climbing, see the trends",
    },
    { name: "author", content: "sendtally" },
    {
      name: "keywords",
      content:
        "climbing log, climbing training log, boulder log, send tracker, climbing grades, climbing trends, Strava climbing",
    },
    { tagName: "link", rel: "canonical", href: url },
  ];
  if (description !== undefined) {
    tags.push(
      { name: "description", content: description },
      { property: "og:description", content: description },
      { name: "twitter:description", content: description }
    );
  }
  if (hreflang) {
    for (const alt of LOCALES) {
      tags.push({
        tagName: "link",
        rel: "alternate",
        hrefLang: alt,
        href: `${SITE_URL}${landingPath(alt)}`,
      });
    }
    tags.push({ tagName: "link", rel: "alternate", hrefLang: "x-default", href: `${SITE_URL}/` });
  }
  if (noindex === true) tags.push({ name: "robots", content: "noindex, nofollow" });
  return tags;
}
