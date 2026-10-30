import {
  byDate,
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
  type HangSession,
  type Milestone,
  type TrendSummary,
  type WeightUnit,
} from "@sendtally/core/hang";
import { formatNumber, t } from "../i18n";
import { dayMonth, gripSetupLabel, loadLabel } from "./format";

const complete = (s: Pick<HangSession, "pct">): boolean => s.pct >= 100;

/** Where the best sits in a series: the completed session that first reached it; -1 with none. */
export function bestIndex(series: readonly HangSession[], summary: TrendSummary): number {
  return series.findIndex((s) => complete(s) && s.loadKg === summary.best);
}

export type GripTileVM = { value: string; label: string };

/** Best completed with its date, top attempt with its completion, and average effort. */
export function gripTiles(
  series: readonly HangSession[],
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
  series: readonly HangSession[],
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
  id: string;
  load: string;
  /** "Sep 25 · 20 mm · 10s × 6" */
  meta: string;
  completion: string;
  /** It beat the best before it on its setup. */
  best: boolean;
};

/** Every session in a grip's series newest first, each marked when it set a best. */
export function gripSessionRows(
  series: readonly HangSession[],
  all: readonly HangSession[],
  unit: WeightUnit
): GripSessionVM[] {
  return [...series].reverse().map((s) => ({
    id: s.id,
    load: loadLabel(s.protocol.kind, s.loadKg, unit),
    meta: `${dayMonth(s.date)} · ${gripSetupLabel(setupOf(s))} × ${s.protocol.reps * s.protocol.sets}`,
    completion: `${s.pct}%`,
    best: newBestBy(all, s) !== null,
  }));
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
  sessions: readonly HangSession[],
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
export function canCompareGrips(sessions: readonly HangSession[]): boolean {
  return setupsOf(sessions).some((setup) => compareGrips(sessions, setup, String).length > 1);
}

export type NewBestVM = { title: string; meta: string };

/** "Half crimp +12 kg", "20 mm · 10s · up 2 kg on your last best"; null unless it beat one. */
export function newBestOf(
  session: HangSession,
  all: readonly HangSession[],
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
  sessions: readonly HangSession[],
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
  const line = kind === "pull" ? load : `${load} · ${t("hang.edgeMm", { n: top.edgeMm })}`;
  return dated ? `${line} · ${dayMonth(last.date)}` : line;
}
