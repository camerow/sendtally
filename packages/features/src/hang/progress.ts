import {
  byDate,
  clock,
  isPullSetup,
  gripSeries,
  milestones,
  newBestBy,
  previousBest,
  setupOf,
  setupsOf,
  summarise,
  toUnit,
  type CalendarDate,
  type GripSetup,
  type HangRun,
  type Milestone,
  type TrendSummary,
  type WeightUnit,
} from "@sendtally/core/hang";
import { formatNumber, t } from "../i18n";
import { hangSets } from "../activities/summary";
import { hangAt } from "../sessions/hang";
import { sessionDay } from "../sessions/meta";
import { dayMonth, gripSetupLabel, loadLabel } from "./format";

const complete = (s: Pick<HangRun, "pct">): boolean => s.pct >= 100;

/** Where the best sits in a series: the completed session that first reached it; -1 with none. */
export function bestIndex(series: readonly HangRun[], summary: TrendSummary): number {
  return series.findIndex((s) => complete(s) && s.loadKg === summary.best);
}

export type GripTileVM = { value: string; label: string };

/** Best completed with its date, top attempt with its completion, and average effort. */
export function gripTiles(
  series: readonly HangRun[],
  summary: TrendSummary,
  unit: WeightUnit
): GripTileVM[] {
  const kind = series[0]?.protocol.kind ?? "hang";
  const best = series[bestIndex(series, summary)];
  const attempt = summary.topAttempt;
  return [
    summary.best === null || best === undefined
      ? { value: "–", label: t("hang.statBest") }
      : {
          value: loadLabel(kind, summary.best, unit),
          label: t("hang.bestOn", { date: dayMonth(best.date) }),
        },
    attempt === null
      ? { value: "–", label: t("hang.statTopAttempt") }
      : {
          value: loadLabel(kind, attempt.loadKg, unit),
          label: t("hang.topAttemptAt", { pct: attempt.pct }),
        },
    {
      value:
        summary.avgRpe === null
          ? "–"
          : t("hang.effortOutOf", {
              value: formatNumber(summary.avgRpe, {
                maximumFractionDigits: 1,
                minimumFractionDigits: 1,
              }),
            }),
      label: t("hang.statAvgEffort"),
    },
  ];
}

export type MilestoneVM = { key: string; text: string; meta: string };

function milestoneText(m: Milestone, unit: WeightUnit): string {
  if (m.kind === "first") return t("hang.milestoneFirst");
  if (m.kind === "over")
    return t("hang.milestoneOver", { load: loadLabel(m.session.protocol.kind, m.kg, unit) });
  return t("hang.milestoneEdge", { edge: t("hang.edgeMm", { n: m.session.edgeMm }) });
}

/** A grip's milestones newest first; on mixed setups each also names the setup it came on. */
export function milestoneRows(
  series: readonly HangRun[],
  unit: WeightUnit,
  mixed: boolean
): MilestoneVM[] {
  return milestones(series)
    .reverse()
    .map((m, i) => ({
      key: `${m.kind}-${m.session.id}-${i}`,
      text: milestoneText(m, unit),
      meta: [dayMonth(m.session.date), ...(mixed ? [gripSetupLabel(setupOf(m.session))] : [])].join(
        " · "
      ),
    }));
}

export type GripSessionVM = {
  /** What the row opens: the session, or a fingerboard part's activity. */
  id: string;
  /** The log's day column: "17" over "Tue". */
  day: number;
  weekday: string;
  /** "16 of 18 hangs": this grip's alone in that session. */
  title: string;
  /** "20 mm · 1:52 under tension"; a pull has no edge. */
  meta: string;
  load: string;
  /** It beat the best before it on its setup. */
  best: boolean;
};

/**
 * A grip's hangs in one session, and its seconds under tension: each set's hangs held times its
 * hang length, or a lone hang's cut seconds where the set stored them. Hangs cut short in a set of
 * several store no seconds of their own, so only its full hangs count. Its total is the dose it
 * planned, which a series entry carries as its protocol: a set that held nothing is never saved.
 */
export function gripHeld(s: HangRun): { held: number; total: number; seconds: number } {
  const sets = hangSets(s);
  return {
    held: sets.reduce((n, x) => n + (x.reps ?? 1), 0),
    total: s.protocol.reps * s.protocol.sets,
    seconds: sets.reduce((n, x) => n + (x.reps ?? 1) * (x.onS ?? s.protocol.hangS), 0),
  };
}

/** Every session in a grip's series newest first, each marked when it set a best. */
export function gripSessionRows(
  series: readonly (HangRun & { activityId?: string })[],
  all: readonly HangRun[],
  unit: WeightUnit
): GripSessionVM[] {
  return [...series].reverse().map((s) => {
    const { held, total, seconds } = gripHeld(s);
    return {
      id: s.activityId ?? s.id,
      ...sessionDay({ start_at: hangAt(s) }),
      title: t("summary.hangsOf", { held, total }),
      meta: [
        ...(isPullSetup(setupOf(s)) ? [] : [t("hang.edgeMm", { n: s.edgeMm })]),
        ...(seconds > 0 ? [t("hang.underTension", { time: clock(seconds, true) })] : []),
      ].join(" · "),
      load: loadLabel(s.protocol.kind, s.loadKg, unit),
      best: newBestBy(all, s) !== null,
    };
  });
}

export type GripCompareVM = {
  gripId: string;
  name: string;
  bestKg: number;
  /** Latest completed load minus the first, on this setup. */
  changeKg: number;
};

/** Each grip's best completed load on one setup, heaviest first; grips with none there left out. */
export function compareGrips(
  sessions: readonly HangRun[],
  setup: GripSetup,
  gripName: (id: string) => string
): GripCompareVM[] {
  return [...new Set(sessions.map((s) => s.gripId))]
    .flatMap((id) => {
      const done = gripSeries(sessions, id, setup).filter(complete);
      const first = done[0];
      const last = done.at(-1);
      if (first === undefined || last === undefined) return [];
      return [
        {
          gripId: id,
          name: gripName(id),
          bestKg: Math.max(...done.map((s) => s.loadKg)),
          changeKg: last.loadKg - first.loadKg,
        },
      ];
    })
    .sort((a, b) => b.bestKg - a.bestKg);
}

/** Two or more grips have a completed session on one setup, so there is something to compare. */
export function canCompareGrips(sessions: readonly HangRun[]): boolean {
  return setupsOf(sessions).some((setup) => compareGrips(sessions, setup, String).length > 1);
}

export type NewBestVM = { title: string; meta: string };

/** "Half crimp +12 kg", "20 mm · 10s · up 2 kg on your last best"; null unless it beat one. */
export function newBestOf(
  session: HangRun,
  all: readonly HangRun[],
  gripName: string,
  unit: WeightUnit
): NewBestVM | null {
  const previous = previousBest(all, session);
  if (previous === null || newBestBy(all, session) === null) return null;
  const by = toUnit(session.loadKg, unit) - toUnit(previous, unit);
  return {
    title: `${gripName} ${loadLabel(session.protocol.kind, session.loadKg, unit)}`,
    meta: [
      gripSetupLabel(setupOf(session)),
      t("hang.upOnLastBest", { change: `${formatNumber(by)} ${unit}` }),
    ].join(" · "),
  };
}

/**
 * A grip's line wherever it is listed: its best load, else its last, with the edge it was
 * on, and with `dated` the day it was last done; Not done yet before its first session.
 */
export function gripMeta(
  sessions: readonly HangRun[],
  gripId: string,
  today: CalendarDate,
  unit: WeightUnit,
  dated = false
): string {
  const onGrip = sessions.filter((s) => s.gripId === gripId).sort(byDate);
  const best = summarise(onGrip, today)?.best;
  const last = onGrip.at(-1);
  if (best === undefined || last === undefined) return t("workouts.notDoneYet");
  const top =
    (best === null ? undefined : onGrip.findLast((s) => complete(s) && s.loadKg === best)) ?? last;
  const kind = top.protocol.kind;
  const kg = best ?? top.loadKg;
  const load =
    kind !== "pull" && kg === 0
      ? t(best === null ? "workouts.exerciseLastBodyweight" : "workouts.exerciseBestBodyweight")
      : t(best === null ? "workouts.exerciseLast" : "workouts.exerciseBest", {
          value: loadLabel(kind, kg, unit),
        });
  // Dated, as a picker shows it beside the setup it already names, it leaves the edge out.
  if (dated) return `${load} · ${dayMonth(last.date)}`;
  return kind === "pull" ? load : `${load} · ${t("hang.edgeMm", { n: top.edgeMm })}`;
}
