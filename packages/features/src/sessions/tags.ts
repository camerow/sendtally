import type { SessionTag } from "@sendtally/api-client";

type Tagged = { tags: SessionTag[] };

export const UNTAGGED_KEY = "untagged";

export const UNTAGGED_LABEL = "Untagged";

export type SessionGrouping = "month" | "tag";

export type TagOption = { slug: string; name: string; count: number };

export type SessionTagGroup<T extends Tagged> = { key: string; label: string; sessions: T[] };

function byCountThenName(a: { count: number; name: string }, b: { count: number; name: string }) {
  return b.count - a.count || a.name.localeCompare(b.name);
}

export function sessionTagOptions<T extends Tagged>(sessions: T[]): TagOption[] {
  const bySlug = new Map<string, TagOption>();
  for (const session of sessions) {
    for (const tag of session.tags) {
      const existing = bySlug.get(tag.slug);
      if (existing) existing.count += 1;
      else bySlug.set(tag.slug, { slug: tag.slug, name: tag.name, count: 1 });
    }
  }
  return [...bySlug.values()].sort(byCountThenName);
}

export function filterSessionsByTags<T extends Tagged>(sessions: T[], slugs: string[]): T[] {
  if (slugs.length === 0) return sessions;
  const wanted = new Set(slugs);
  return sessions.filter((s) =>
    s.tags.length === 0 ? wanted.has(UNTAGGED_KEY) : s.tags.some((t) => wanted.has(t.slug))
  );
}

export function sessionTagGroups<T extends Tagged>(sessions: T[]): Array<SessionTagGroup<T>> {
  const groups = new Map<string, SessionTagGroup<T>>();
  const untagged: T[] = [];
  for (const session of sessions) {
    if (session.tags.length === 0) {
      untagged.push(session);
      continue;
    }
    for (const tag of session.tags) {
      const existing = groups.get(tag.slug);
      if (existing) existing.sessions.push(session);
      else groups.set(tag.slug, { key: tag.slug, label: tag.name, sessions: [session] });
    }
  }
  const tagged = [...groups.values()].sort((a, b) =>
    byCountThenName(
      { count: a.sessions.length, name: a.label },
      { count: b.sessions.length, name: b.label }
    )
  );
  return untagged.length === 0
    ? tagged
    : [...tagged, { key: UNTAGGED_KEY, label: UNTAGGED_LABEL, sessions: untagged }];
}

export function sameTagName(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}
