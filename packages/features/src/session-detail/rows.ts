import { climbDiscipline, climbRank, type Endurance } from "@sendtally/core";
import type {
  CircuitColour,
  ClimbSummary,
  SessionClimb,
  SessionDetail,
} from "@sendtally/api-client";
import type { ClimbLogRowVM } from "../climbs/log";
import { isThisClimb, sendStyleText } from "../climbs/overview";
import { disciplineLabel } from "../log-session/types";
import { climbKey } from "../climbs/transforms";
import { t } from "../i18n";
import { enduranceLapCountLabel, enduranceSummaryLabel } from "../log-session/endurance";
import { climbGradeLabel, type GradeScales } from "../sessions/grades";
import type { ClimbSort } from "./types";

/**
 * A row of the session's climbs, as the log draws it. A row with no climb page (`id` null) is
 * one or more climbs logged with only a grade, read by their discipline.
 */
export type SessionClimbRowVM = Omit<ClimbLogRowVM, "id" | "pill"> & {
  id: string | null;
  pill: ClimbLogRowVM["pill"] | null;
  /** An unnamed gym climb's circuit, which fills its grade badge. */
  colour?: CircuitColour;
  endurance?: Endurance;
  /** For sorting: the order it was first logged in, its hardest grade and its tries. */
  n: number;
  rank: number;
  tries: number;
};

type Group = { key: string; record: ClimbSummary | undefined; logged: SessionClimb[] };

function groupKey(
  c: SessionClimb,
  record: ClimbSummary | undefined,
  i: number,
  scales: GradeScales
): string {
  if (c.endurance !== undefined) return `endurance:${i}`;
  if (record !== undefined) return `climb:${record.id}`;
  const name = climbKey(c.name);
  if (name !== "") return `name:${name}`;
  if (c.circuit !== undefined) return `circuit:${c.circuit.id}`;
  return `grade:${climbDiscipline(c)}:${climbGradeLabel(c, scales)}`;
}

function pillOf(group: Group, tries: number): ClimbLogRowVM["pill"] {
  const send = group.logged.find((l) => l.kind === "send");
  if (send !== undefined) {
    const style = send.style ?? "redpoint";
    return { kind: style === "redpoint" ? "sent" : style, label: sendStyleText(style) };
  }
  if (group.record?.project === true && group.record.sent_at === null) {
    return { kind: "project", label: t("common.project") };
  }
  return { kind: "tries", label: t("tally.tryCount", { count: tries }) };
}

function rowOf(group: Group, n: number, showArea: boolean, scales: GradeScales): SessionClimbRowVM {
  const [first] = group.logged as [SessionClimb, ...SessionClimb[]];
  const tries = group.logged.reduce((sum, l) => sum + l.tries, 0);
  const count = group.logged.length;
  const named = climbKey(first.name) !== "";
  const name = named ? (group.record?.name ?? first.name) : disciplineLabel(climbDiscipline(first));
  const base = {
    id: named ? (group.record?.id ?? null) : null,
    gradeLabel: climbGradeLabel(first, scales),
    name,
    count,
    n,
    rank: Math.max(...group.logged.map(climbRank)),
    tries,
    ...(!named && first.circuit !== undefined ? { colour: first.circuit.colour } : {}),
  };
  const area = showArea ? (first.area?.name ?? null) : null;
  if (first.endurance !== undefined) {
    const laps = `${enduranceLapCountLabel(first.endurance.laps.length)} · ${enduranceSummaryLabel(first.endurance)}`;
    return { ...base, endurance: first.endurance, pill: null, meta: laps };
  }
  const pill = pillOf(group, tries);
  const meta = [area, pill.kind === "tries" ? null : t("tally.tryCount", { count: tries })];
  return { ...base, pill, meta: meta.filter((part) => part !== null).join(" · ") };
}

/** A climb names its area on a day with two or more, or indoors, where an area marks it outdoor. */
export function namesClimbAreas(session: Pick<SessionDetail, "areas" | "location">): boolean {
  return session.areas.length >= 2 || session.location === "indoor";
}

/**
 * The session's climbs as the log draws them: a climb logged more than once is one row with its
 * tries summed, and so are unnamed climbs at one grade or on one circuit. A row names its area
 * only when the day had two or more, or in an Indoor session, where an area marks it outdoor.
 */
export function sessionClimbRows(
  session: Pick<SessionDetail, "climbs" | "areas" | "location">,
  catalogue: readonly ClimbSummary[],
  scales: GradeScales
): SessionClimbRowVM[] {
  const ordered = [...session.climbs].sort((a, b) => Date.parse(a.time) - Date.parse(b.time));
  const groups = new Map<string, Group>();
  ordered.forEach((c, i) => {
    const record =
      climbKey(c.name) === "" ? undefined : catalogue.find((known) => isThisClimb(known, c));
    const key = groupKey(c, record, i, scales);
    const group = groups.get(key) ?? { key, record, logged: [] };
    group.logged.push(c);
    groups.set(key, group);
  });
  const showArea = namesClimbAreas(session);
  return [...groups.values()].map((group, i) => rowOf(group, i + 1, showArea, scales));
}

const SORTS: Record<ClimbSort, (a: SessionClimbRowVM, b: SessionClimbRowVM) => number> = {
  order: (a, b) => a.n - b.n,
  gradeDesc: (a, b) => b.rank - a.rank || a.n - b.n,
  gradeAsc: (a, b) => a.rank - b.rank || a.n - b.n,
  attempts: (a, b) => b.tries - a.tries || a.n - b.n,
};

export function sortClimbRows(rows: SessionClimbRowVM[], sort: ClimbSort): SessionClimbRowVM[] {
  return [...rows].sort(SORTS[sort]);
}
