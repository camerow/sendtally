import { normalizeTagName, type NormalizedTag } from "@sendtally/core";
import { z } from "zod";

export const MAX_TAGS_PER_SESSION = 12;
export const MAX_TAG_NAME_LENGTH = 40;

export { normalizeTagName, tagSlug, type NormalizedTag } from "@sendtally/core";

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
