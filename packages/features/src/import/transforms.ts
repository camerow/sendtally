import { effortGrade, formatGrade, type Grade } from "@sendtally/core";
import type { ImportSession } from "@sendtally/core/import";
import { sameTagName } from "../sessions/tags";

export type PlanStats = { sessions: number; climbs: number; topGrade: string | null };

export function planStats(sessions: ImportSession[]): PlanStats {
  let top: Grade | undefined;
  let climbs = 0;
  for (const s of sessions) {
    for (const c of s.climbs) {
      climbs++;
      if (top === undefined || effortGrade(c.grade) > effortGrade(top)) top = c.grade;
    }
  }
  return {
    sessions: sessions.length,
    climbs,
    topGrade: top === undefined ? null : formatGrade(top),
  };
}

export type SessionNameCount = { name: string; sessions: number };

const MAX_SESSION_TAGS = 12;

export const sessionTitle = (session: ImportSession): string | undefined =>
  session.name ?? session.gym;

export function sessionNames(sessions: ImportSession[]): SessionNameCount[] {
  const counts = new Map<string, number>();
  for (const s of sessions) {
    const name = sessionTitle(s);
    if (name !== undefined) counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return [...counts]
    .map(([name, n]) => ({ name, sessions: n }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function withTag(tags: string[], tag: string): string[] {
  const name = tag.trim();
  return name === "" || tags.some((t) => sameTagName(t, name)) ? tags : [...tags, name];
}

export function withAddedTags(
  sessions: ImportSession[],
  added: ReadonlyArray<string[] | undefined>
): ImportSession[] {
  return sessions.map((s, i) => {
    const extra = added[i] ?? [];
    if (extra.length === 0) return s;
    const tags = extra.reduce(withTag, s.tags ?? []);
    return { ...s, tags: tags.slice(0, MAX_SESSION_TAGS) };
  });
}
