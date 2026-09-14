import { z } from "zod";

export const MAX_TAGS_PER_SESSION = 12;
export const MAX_TAG_NAME_LENGTH = 40;

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

export function normalizeTagNames(raw: string[]): NormalizedTag[] | null {
  const bySlug = new Map<string, NormalizedTag>();
  for (const entry of raw) {
    const tag = normalizeTagName(entry);
    if (tag === null) return null;
    if (!bySlug.has(tag.slug)) bySlug.set(tag.slug, tag);
  }
  return [...bySlug.values()];
}

export const tagNames = z
  .array(z.string().max(MAX_TAG_NAME_LENGTH))
  .max(MAX_TAGS_PER_SESSION)
  .transform((raw, ctx) => {
    const normalized = normalizeTagNames(raw);
    if (normalized === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "every tag needs at least one letter or number",
      });
      return z.NEVER;
    }
    return normalized;
  });

export const sessionTagsBody = z.object({ tags: tagNames });
