export type NormalizedTag = { name: string; slug: string };

export function tagSlug(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['\u2018\u2019`]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizeTagName(raw: string): NormalizedTag | null {
  const name = raw.trim().replace(/\s+/g, " ");
  const slug = tagSlug(name);
  return name === "" || slug === "" ? null : { name, slug };
}
