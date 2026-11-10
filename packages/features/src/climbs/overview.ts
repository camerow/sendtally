import type { ClimbNote, ClimbSummary, SessionWithClimbs } from "@sendtally/api-client";
import { t } from "../i18n";
import type { ClimbStyle } from "../log-session/types";
import { utcDate } from "../log-session/transforms";
import { isClimbHolder, isUnscored } from "../sessions/meta";
import { sessionTitle } from "../sessions/title";
import { dateLabel } from "./projects";
import { climbGradeLabel, climbKey } from "./transforms";

/** A logged climb is this one when stamped with its id, or, unstamped, when it carries its name. */
export function isThisClimb(
  climb: Pick<ClimbSummary, "id" | "name">,
  logged: { name: string; userClimbId?: string | undefined }
): boolean {
  return logged.userClimbId === undefined
    ? climbKey(logged.name) === climbKey(climb.name)
    : logged.userClimbId === climb.id;
}

type ByIdAndName<T> = { byId: Map<string, T>; byName: Map<string, T> };

/** Built once per list and looked up after, so a log of hundreds of sessions is not rescanned per row. */
function indexed<L extends object, T>(
  cache: WeakMap<L, ByIdAndName<T>>,
  list: L,
  build: (add: (id: string | undefined, name: string, value: T) => void) => void
): ByIdAndName<T> {
  const known = cache.get(list);
  if (known !== undefined) return known;
  const index: ByIdAndName<T> = { byId: new Map(), byName: new Map() };
  build((id, name, value) => {
    if (id !== undefined && !index.byId.has(id)) index.byId.set(id, value);
    const key = climbKey(name);
    if (id === undefined && !index.byName.has(key)) index.byName.set(key, value);
  });
  cache.set(list, index);
  return index;
}

const climbIndexes = new WeakMap<readonly ClimbSummary[], ByIdAndName<ClimbSummary>>();

/** The climb a logged one is, by the same rule as `isThisClimb`; the first in the list wins. */
export function climbOf(
  climbs: readonly ClimbSummary[],
  logged: { name: string; userClimbId?: string | undefined }
): ClimbSummary | undefined {
  const index = indexed(climbIndexes, climbs, (add) => {
    for (const c of climbs) {
      add(c.id, c.name, c);
      add(undefined, c.name, c);
    }
  });
  return logged.userClimbId === undefined
    ? index.byName.get(climbKey(logged.name))
    : index.byId.get(logged.userClimbId);
}

type FirstSend = { order: number; style: ClimbStyle | undefined };

const firstSends = new WeakMap<readonly SessionWithClimbs[], ByIdAndName<FirstSend>>();

/** How the first send went: a flash or onsight is named, any other send is just sent. */
export function sendStyleOf(
  climb: ClimbSummary,
  sessions: readonly SessionWithClimbs[]
): ClimbStyle {
  const index = indexed(firstSends, sessions, (add) => {
    const sends = [...sessions]
      .sort((a, b) => a.start_at.localeCompare(b.start_at))
      .flatMap((s) => s.climbs);
    sends.forEach((c, order) => {
      if (c.kind === "send") add(c.userClimbId, c.name, { order, style: c.style });
    });
  });
  const [stamped, named] = [index.byId.get(climb.id), index.byName.get(climbKey(climb.name))];
  const first =
    stamped === undefined || (named !== undefined && named.order < stamped.order) ? named : stamped;
  return first?.style ?? "redpoint";
}

export function sendStyleText(style: ClimbStyle): string {
  if (style === "flash") return t("logSession.styleFlash");
  if (style === "onsight") return t("logSession.styleOnsight");
  return t("common.sent");
}

export type ClimbSessionRowVM = {
  fingerprint: string;
  day: string;
  name: string;
  rpe: number | null;
  dateLabel: string;
  meta: string;
  note: string | null;
  triesLabel: string;
  /** Off for the untitled session a climb added on its own is filed in, which has nothing to show. */
  opens: boolean;
};

export type ClimbDetailVM = {
  id: string;
  name: string;
  /** The name with its grade after it: the grade is the climb, the kicker only its kind. */
  title: string;
  /** Where it is, then the day it was first tried. */
  meta: string;
  project: boolean;
  days: string;
  tries: string;
  best: string;
  sessions: ClimbSessionRowVM[];
  /** Notes written on its page with no session behind them, newest day first. */
  notes: Array<ClimbNote & { dateLabel: string }>;
};

/** Every session with this climb in it, newest first. */
export function climbSessions(
  climb: ClimbSummary,
  sessions: readonly SessionWithClimbs[]
): ClimbSessionRowVM[] {
  return [...sessions]
    .sort((a, b) => b.start_at.localeCompare(a.start_at))
    .flatMap((s) => {
      const rows = s.climbs.filter((c) => isThisClimb(climb, c));
      if (rows.length === 0) return [];
      const result = rows.some((c) => c.kind === "send")
        ? t("common.sent")
        : t("sessionDetail.notYet");
      const holder = isClimbHolder(s);
      return [
        {
          fingerprint: s.fingerprint,
          day: utcDate(s.start_at),
          name: holder ? result : sessionTitle(s),
          rpe: isUnscored(s) ? null : s.rpe,
          dateLabel: dateLabel(s.start_at),
          meta: holder ? "" : result,
          opens: !holder,
          note: rows.find((c) => c.note !== null)?.note ?? null,
          triesLabel: t("tally.tryCount", { count: rows.reduce((n, c) => n + c.tries, 0) }),
        },
      ];
    });
}

/** "Name, grade", as the climb page and its log page head it. */
export function climbTitle(climb: Pick<ClimbSummary, "name" | "grade">): string {
  return climb.grade === null ? climb.name : `${climb.name}, ${climbGradeLabel(climb)}`;
}

export function climbDetailVM(
  climb: ClimbSummary,
  sessions: readonly SessionWithClimbs[]
): ClimbDetailVM {
  return {
    id: climb.id,
    name: climb.name,
    title: climbTitle(climb),
    meta: [
      ...(climb.area?.name === undefined ? [] : [climb.area.name]),
      t("climbs.firstTried", { date: dateLabel(climb.first_at) }),
    ].join(" · "),
    project: climb.project,
    days: String(climb.sessions),
    tries: String(climb.attempts),
    best: climb.sent_at === null ? "-" : sendStyleText(sendStyleOf(climb, sessions)),
    sessions: climbSessions(climb, sessions),
    notes: climb.notes.map((n) => ({ ...n, dateLabel: dateLabel(n.day) })),
  };
}
