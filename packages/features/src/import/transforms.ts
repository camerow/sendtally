import { effortGrade, type Grade } from "@sendtally/core";
import { IMPORT_SERVICES, type ImportFormat, type ImportSession } from "@sendtally/core/import";
import { t } from "../i18n";
import { displayGrade, type GradeScales } from "../sessions/grades";
import { tallyLabel } from "../sessions/meta";
import { sameTagName } from "../sessions/tags";

export type PlanStats = {
  sessions: number;
  sends: number;
  attempts: number;
  topGrade: string | null;
};

export function planStats(sessions: ImportSession[], scales: GradeScales): PlanStats {
  let top: Grade | undefined;
  let sends = 0;
  let attempts = 0;
  for (const s of sessions) {
    for (const c of s.climbs) {
      if (c.kind === "send") sends++;
      else attempts++;
      if (top === undefined || effortGrade(c.grade) > effortGrade(top)) top = c.grade;
    }
  }
  return {
    sessions: sessions.length,
    sends,
    attempts,
    topGrade: top === undefined ? null : displayGrade(top, scales),
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

/** An imported session's row tally, read as the Log row reads a logged one. */
export function importTally(session: ImportSession, scales: GradeScales): string[] {
  const sends = session.climbs.filter((c) => c.kind === "send");
  const top = planStats([{ ...session, climbs: sends }], scales).topGrade;
  return tallyLabel({ sends: sends.length, attempts: session.climbs.length - sends.length, top });
}

/** What kind of file a review is reading, as its kicker names it. */
export const importFormatLabel = (format: ImportFormat): string =>
  format === "sendtally"
    ? t("import.formatSendtally")
    : format === "spreadsheet"
      ? t("import.formatSpreadsheet")
      : t("import.formatExport", { service: IMPORT_SERVICES[format] });
