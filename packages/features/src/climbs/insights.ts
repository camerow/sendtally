import {
  boulderGradeFromV,
  climbDiscipline,
  climbRank,
  formatGrade,
  isEndurance,
  type ClimbStyle,
  type Discipline,
} from "@sendtally/core";
import type {
  Activity,
  ClimbSummary,
  SessionClimb,
  SessionWithClimbs,
} from "@sendtally/api-client";
import type { SetClimb } from "@sendtally/core/hang";
import { activityAt } from "../activities/format";
import { draftGrade, vGradeOf } from "../log-session/transforms";
import { gradeFormatterFor, type GradeFormatter } from "../sessions/grades";
import { bucketsFor, windowOf } from "../trends/buckets";
import type { TrendRange } from "../trends/types";
import { dayMonth } from "../hang/format";
import { t } from "../i18n";
import type { ClimbLogRowVM } from "./log";
import { sendStyleText } from "./overview";
import { dateLabel } from "./projects";
import { rowsOf, type PyramidRow } from "./pyramid";
import { climbKey } from "./transforms";

/** Where the climbing was: anywhere, outside at a crag, or inside at a gym. */
export type ClimbPlaceFilter = "all" | "outdoor" | "indoor";

export const CLIMB_PLACES: readonly ClimbPlaceFilter[] = ["all", "outdoor", "indoor"];

export type ClimbingInsightsFilter = {
  range: TrendRange;
  discipline: Discipline;
  place: ClimbPlaceFilter;
  boulderScale: BoulderScale;
};

/** How the climber reads boulder grades. */
export type BoulderScale = "v" | "font";

export type ClimbingInsightsVM = {
  avgSend: string | null;
  sends: number;
  flashed: number;
  projects: number;
  pyramid: PyramidRow[];
  hardest: { gradeLabel: string; name: string | null; dateLabel: string } | null;
  byGrade: GradeClimbsVM[];
};

/** A climb under its grade; `opens` is false for one with no name, which has no screen. */
export type GradeClimbVM = { key: string; opens: boolean; row: ClimbLogRowVM };

/** One grade's climbs, newest first, and how many of them went. */
export type GradeClimbsVM = {
  key: string;
  gradeLabel: string;
  split: string;
  climbs: GradeClimbVM[];
};

type Tried = {
  key: string;
  rank: number;
  name: string;
  userClimbId: string | undefined;
  sent: boolean;
  flashed: boolean;
  style: ClimbStyle | null;
  sentAt: string | null;
  tries: number;
  days: number;
  lastAt: string;
};

type InsightsClimb = Pick<
  SessionClimb,
  "name" | "kind" | "style" | "vGrade" | "grade" | "endurance" | "tries" | "userClimbId"
>;

/** What the insights read of a session: where and when, and its climbs. */
export type InsightsSession = Pick<SessionWithClimbs, "fingerprint" | "start_at" | "location"> & {
  climbs: readonly InsightsClimb[];
};

const insightsClimb = (c: SetClimb): InsightsClimb => ({
  name: c.name ?? "",
  kind: c.sent ? "send" : "attempt",
  tries: c.tries,
  ...(c.sent ? { style: c.style ?? (c.tries === 1 ? "flash" : "redpoint") } : {}),
  vGrade: vGradeOf(c.grade, c.scale) ?? -1,
  grade: draftGrade(c.grade, c.scale),
});

/** Each workout's tally climbs as an indoor session on its day, so they count with the rest. */
export function workoutClimbSessions(
  activities: readonly Pick<Activity, "id" | "date" | "startTime" | "done">[]
): InsightsSession[] {
  return activities.flatMap((a) => {
    const climbs = a.done.flatMap((d) => d.sets.flatMap((s) => s.climbs ?? []));
    if (climbs.length === 0) return [];
    return [
      {
        fingerprint: a.id,
        start_at: activityAt(a),
        location: "indoor" as const,
        climbs: climbs.map(insightsClimb),
      },
    ];
  });
}

const graded = (c: InsightsClimb): boolean => !isEndurance(c) && climbRank(c) >= 0;

const placed = (s: InsightsSession, place: ClimbPlaceFilter): boolean =>
  place === "all" || (place === "outdoor") === (s.location === "outdoor");

/** The discipline with the most graded climbs logged, boulder on a tie. */
export function mainDiscipline(sessions: readonly InsightsSession[]): Discipline {
  const climbs = sessions.flatMap((s) => s.climbs.filter(graded));
  const routes = climbs.filter((c) => climbDiscipline(c) === "route").length;
  return routes * 2 > climbs.length ? "route" : "boulder";
}

/**
 * Each climb tried in the window once: a named climb is one climb however many sessions it
 * took, sent if any of them sent it; an unnamed one counts on its own.
 */
function triedIn(sessions: readonly InsightsSession[], discipline: Discipline): Tried[] {
  const byKey = new Map<string, Tried>();
  const ordered = [...sessions].sort((a, b) => a.start_at.localeCompare(b.start_at));
  for (const s of ordered) {
    s.climbs.forEach((c, i) => {
      if (!graded(c) || climbDiscipline(c) !== discipline) return;
      const key = climbKey(c.name) === "" ? `${s.fingerprint}:${i}` : climbKey(c.name);
      const held = byKey.get(key);
      const send = c.kind === "send";
      const style = send ? (c.style ?? "redpoint") : null;
      byKey.set(key, {
        key,
        rank: climbRank(c),
        name: c.name.trim(),
        userClimbId: c.userClimbId ?? held?.userClimbId,
        sent: (held?.sent ?? false) || send,
        flashed: (held?.flashed ?? false) || (send && c.style !== "redpoint"),
        style: held?.style ?? style,
        sentAt: held?.sentAt ?? (send ? s.start_at : null),
        tries: (held?.tries ?? 0) + c.tries,
        days: (held?.days ?? 0) + (held?.lastAt === s.start_at ? 0 : 1),
        lastAt: s.start_at,
      });
    });
  }
  return [...byKey.values()];
}

/**
 * The mean grade of the sends on the grade ladder, rounded down to a grade: boulders in the
 * climber's scale, routes in the scale they were logged in.
 */
export function avgSendLabel(
  ranks: readonly number[],
  format: GradeFormatter,
  boulderScale: BoulderScale
): string | null {
  if (ranks.length === 0) return null;
  const rank = Math.floor(ranks.reduce((sum, r) => sum + r, 0) / ranks.length);
  const boulder =
    format.discipline === "boulder" ? boulderGradeFromV(boulderScale, rank) : undefined;
  return boulder === undefined ? format.label(rank) : formatGrade(boulder);
}

function gradeClimb(c: Tried, climbs: readonly ClimbSummary[], gradeLabel: string): GradeClimbVM {
  const found =
    c.name === ""
      ? undefined
      : climbs.find((x) =>
          c.userClimbId === undefined ? climbKey(x.name) === c.key : x.id === c.userClimbId
        );
  const pill: ClimbLogRowVM["pill"] =
    c.style !== null
      ? { kind: c.style === "redpoint" ? "sent" : c.style, label: sendStyleText(c.style) }
      : found?.project === true
        ? { kind: "project", label: t("common.project") }
        : { kind: "tries", label: t("tally.tryCount", { count: c.tries }) };
  const area = found?.area?.name;
  const when = c.days > 1 ? t("climbs.dayCount", { count: c.days }) : dateLabel(c.lastAt);
  return {
    key: c.key,
    opens: found !== undefined,
    row: {
      id: found?.id ?? c.key,
      gradeLabel,
      name: found?.name ?? (c.name === "" ? t("logSession.unnamed") : c.name),
      meta: area === undefined ? when : `${area} · ${when}`,
      pill,
    },
  };
}

function gradeSplit(sent: number, attempted: number): string {
  if (attempted === 0) return t("climbs.gradeSent", { sent });
  if (sent === 0) return t("climbs.gradeAttempted", { attempted });
  return t("climbs.gradeSplit", { sent, attempted });
}

/** The climbs tried, one group per grade, hardest first, each grade's climbs newest first. */
function climbsByGrade(
  tried: readonly Tried[],
  climbs: readonly ClimbSummary[],
  label: (rank: number) => string
): GradeClimbsVM[] {
  const ranks = [...new Set(tried.map((c) => c.rank))].sort((a, b) => b - a);
  return ranks.map((rank) => {
    const mine = tried
      .filter((c) => c.rank === rank)
      .sort((a, b) => b.lastAt.localeCompare(a.lastAt));
    const sent = mine.filter((c) => c.sent).length;
    return {
      key: String(rank),
      gradeLabel: label(rank),
      split: gradeSplit(sent, mine.length - sent),
      climbs: mine.map((c) => gradeClimb(c, climbs, label(rank))),
    };
  });
}

/** Climbing over a range, in one discipline and place: the tiles, the pyramid and the top send. */
export function climbingInsightsVM(
  sessions: readonly InsightsSession[],
  climbs: readonly ClimbSummary[],
  filter: ClimbingInsightsFilter,
  now: Date = new Date()
): ClimbingInsightsVM {
  const first =
    sessions.length === 0 ? null : Math.min(...sessions.map((s) => Date.parse(s.start_at)));
  const { start, end } = windowOf(bucketsFor(filter.range, now, first));
  const inRange = sessions.filter((s) => {
    const at = Date.parse(s.start_at);
    return at >= start && at < end;
  });
  const shown = inRange.filter((s) => placed(s, filter.place));
  const tried = triedIn(shown, filter.discipline);
  const sent = tried.filter((c) => c.sent);
  const format = gradeFormatterFor(
    shown.flatMap((s) => s.climbs),
    filter.discipline
  );
  const hardest = [...sent].sort(
    (a, b) => b.rank - a.rank || (a.sentAt ?? "").localeCompare(b.sentAt ?? "")
  )[0];
  return {
    avgSend: avgSendLabel(
      sent.map((c) => c.rank),
      format,
      filter.boulderScale
    ),
    sends: sent.length,
    flashed: sent.filter((c) => c.flashed).length,
    projects: climbs.filter(
      (c) => c.project && c.sent_at === null && c.discipline === filter.discipline
    ).length,
    pyramid: rowsOf(
      tried.map((c) => ({ rank: c.rank, inner: c.sent })),
      format.label,
      (inner, all) => `${inner}/${all}`
    ),
    hardest:
      hardest === undefined
        ? null
        : {
            gradeLabel: format.label(hardest.rank),
            name: hardest.name === "" ? null : hardest.name,
            dateLabel: dayMonth((hardest.sentAt ?? "").slice(0, 10)),
          },
    byGrade: climbsByGrade(tried, climbs, format.label),
  };
}
