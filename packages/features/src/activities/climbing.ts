import { countText } from "../hang/format";
import { clock, type Dose, type SetClimb, type SetDone } from "@sendtally/core/hang";
import type { TallyMeasure } from "../exercises/types";
import { t } from "../i18n";
import { vGradeOf } from "../log-session/transforms";
import { enduranceAmountLabel } from "../log-session/endurance";

/** What one lap of a circuit asks for: time when the dose holds a time, moves otherwise. */
export const lapPlanOf = (dose: Dose): { unit: "moves" | "seconds"; target: number } =>
  dose.onS !== undefined
    ? { unit: "seconds", target: dose.onS }
    : { unit: "moves", target: dose.reps ?? 0 };

/** What a logged circuit's laps were measured against: its dose, else the laps themselves. */
export const lapPlanFor = (
  dose: Dose | undefined,
  laps: readonly Pick<SetDone, "reps" | "onS">[]
): { unit: "moves" | "seconds"; target: number } =>
  dose !== undefined
    ? lapPlanOf(dose)
    : laps.some((l) => l.onS !== undefined)
      ? { unit: "seconds", target: Math.max(0, ...laps.map((l) => l.onS ?? 0)) }
      : { unit: "moves", target: Math.max(0, ...laps.map((l) => l.reps ?? 0)) };

/** "3 laps · 2 clean": laps logged as sets, each clean when it reached the lap's target. */
export function lapsLine(sets: readonly SetDone[], dose: Dose): string {
  const { unit, target } = lapPlanOf(dose);
  const clean = sets.filter((s) => (unit === "moves" ? s.reps : s.onS) === target).length;
  return t("activities.lapsClean", { count: sets.length, clean });
}

/** What a climbing exercise's sets add up to: climbs, sends, and the hardest send. */
export type ClimbsTotal = { climbs: number; sent: number; top: string | null };

const climbsOf = (sets: readonly SetDone[]): SetClimb[] => sets.flatMap((s) => s.climbs ?? []);

/** Sets logged on the session tally, which hold climbs rather than numbers. */
export const isClimbingSets = (sets: readonly SetDone[]): boolean =>
  sets.some((s) => s.climbs !== undefined);

const rank = (c: SetClimb): number => vGradeOf(c.grade, c.scale) ?? -1;

export function climbsTotal(sets: readonly SetDone[]): ClimbsTotal {
  const climbs = climbsOf(sets);
  const sends = climbs.filter((c) => c.sent && c.grade !== "");
  const top = sends.reduce<SetClimb | null>(
    (a, c) => (a === null || rank(c) > rank(a) ? c : a),
    null
  );
  return {
    climbs: climbs.length,
    sent: climbs.filter((c) => c.sent).length,
    top: top?.grade ?? null,
  };
}

/** A logged climb's attempts, at least one, a send styled by them: flash at one, redpoint above. */
export function withClimbTries(climb: SetClimb, tries: number): SetClimb {
  const { style: _style, ...rest } = climb;
  const next = Math.min(99, Math.max(1, tries));
  if (!climb.sent) return { ...rest, tries: next };
  const style = next > 1 ? "redpoint" : climb.style === "onsight" ? "onsight" : "flash";
  return { ...rest, tries: next, style };
}

/** A logged climb turned from a send to an attempt, or back. */
export const withClimbSent = (climb: SetClimb): SetClimb =>
  withClimbTries({ ...climb, sent: !climb.sent }, climb.tries);

/** "2 attempts · sent": one climb of a set, as its row reads. */
export const climbLine = (climb: SetClimb): string =>
  [
    t("logSession.attemptCount", { count: climb.tries }),
    ...(climb.sent ? [t("summary.sent")] : []),
  ].join(" · ");

/** "16 climbs · 15 sent · top V4" */
export function climbsLine(sets: readonly SetDone[]): string {
  const { climbs, sent, top } = climbsTotal(sets);
  return [
    t("common.climbCount", { count: climbs }),
    t("tally.sentCount", { count: sent }),
    ...(top === null ? [] : [t("sessions.topSend", { grade: top })]),
  ].join(" · ");
}

/** "20:00 · 18 climbs": one set of time on the wall. */
export const wallChip = (set: SetDone): string =>
  [
    ...(set.onS === undefined ? [] : [clock(set.onS, true)]),
    t("common.climbCount", { count: set.climbs?.length ?? 0 }),
  ].join(" · ");

/** "45:00 min": a time on the wall. */
export const wallTimeText = (seconds: number): string =>
  t("activities.wallTime", { time: clock(seconds, true) });

/** "40:00 min · Green circuit": the time over every set, and the circuits climbed. */
export function wallLine(sets: readonly SetDone[]): string {
  const seconds = sets.reduce((n, s) => n + (s.onS ?? 0), 0);
  const circuits = [...new Set(climbsOf(sets).flatMap((c) => c.circuit?.label ?? []))];
  return [
    wallTimeText(seconds),
    ...circuits.map((name) => t("activities.circuitNamed", { name })),
  ].join(" · ");
}

/** What a climbing set reads as anywhere a set shows: "20:00 · 18 climbs", or "4 climbs · 3 sent". */
export const climbingSetText = (set: SetDone): string =>
  set.onS !== undefined ? wallChip(set) : climbsLine([set]);

/** "45:00 min" for one set of time on the wall, and "2 × 45:00 min" or "1-2 × 45:00 min" for more. */
export function wallDoseLine(dose: Pick<Dose, "sets" | "setsMax" | "onS">): string {
  const time = wallTimeText(dose.onS ?? 0);
  return dose.sets === 1 && dose.setsMax === undefined
    ? time
    : `${countText(dose.sets, dose.setsMax)} × ${time}`;
}

/** "4 sets of 4 climbs", "2 × 20:00 min", or "1 set" when a set runs until the next one starts. */
export function climbingDoseLine(dose: Dose, measure: TallyMeasure): string {
  if (measure === "laps") {
    const plan = lapPlanOf(dose);
    return t("activities.lapsOf", {
      count: dose.setsMax ?? dose.sets,
      n: countText(dose.sets, dose.setsMax),
      amount: enduranceAmountLabel({ ...plan, laps: [] }, plan.target),
    });
  }
  if (measure === "wallTime") return wallDoseLine(dose);
  return dose.reps === undefined
    ? dose.setsMax === undefined
      ? t("activities.setCount", { count: dose.sets })
      : t("workouts.targetSets", { count: dose.setsMax, n: countText(dose.sets, dose.setsMax) })
    : t("activities.setsOfClimbs", {
        count: dose.setsMax ?? dose.sets,
        n: countText(dose.sets, dose.setsMax),
        climbs: countText(dose.reps, dose.repsMax),
      });
}

/** "Last time: 16 climbs · 13 sent · top V4", or null before there was a last time. */
export function climbingLastTime(
  sets: readonly SetDone[],
  measure: TallyMeasure,
  dose?: Dose
): string | null {
  if (measure === "laps") {
    return sets.length === 0 || dose === undefined
      ? null
      : t("activities.lastTimeLine", { summary: lapsLine(sets, dose) });
  }
  if (!isClimbingSets(sets)) return null;
  const summary = measure === "wallTime" ? wallLine(sets) : climbsLine(sets);
  return t("activities.lastTimeLine", { summary });
}
