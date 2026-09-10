export const SITE_URL = "https://sendtally.com";

export const INDEXABLE_PATHS = ["/", "/privacy", "/terms", "/support"];

type PageMeta = {
  title: string;
  description?: string;
  path: string;
  noindex?: boolean;
};

export function pageMeta({
  title,
  description,
  path,
  noindex,
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
      content: "sendtally - a climbing session log with an effort score",
    },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:image", content: image },
    { tagName: "link", rel: "canonical", href: url },
  ];
  if (description !== undefined) {
    tags.push(
      { name: "description", content: description },
      { property: "og:description", content: description },
      { name: "twitter:description", content: description }
    );
  }
  if (noindex === true) tags.push({ name: "robots", content: "noindex, nofollow" });
  return tags;
}
