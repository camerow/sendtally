import { clock, type Dose, type SetClimb, type SetDone } from "@sendtally/core/hang";
import type { TallyMeasure } from "../exercises/types";
import { t } from "../i18n";
import { vGradeOf } from "../log-session/transforms";

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

/** "16 climbs · 15 sent · top V4" */
export function climbsLine(sets: readonly SetDone[]): string {
  const { climbs, sent, top } = climbsTotal(sets);
  return [
    t("common.climbCount", { count: climbs }),
    t("tally.sentCount", { count: sent }),
    ...(top === null ? [] : [t("sessions.topSend", { grade: top })]),
  ].join(" · ");
}

/** "20:00 · 18 laps": one set of time on the wall. */
export const wallChip = (set: SetDone): string =>
  [
    ...(set.onS === undefined ? [] : [clock(set.onS, true)]),
    t("tally.lapCount", { count: set.climbs?.length ?? 0 }),
  ].join(" · ");

/** "40:00 on the wall · Green circuit": the time over every set, and the circuits climbed. */
export function wallLine(sets: readonly SetDone[]): string {
  const seconds = sets.reduce((n, s) => n + (s.onS ?? 0), 0);
  const circuits = [...new Set(climbsOf(sets).flatMap((c) => c.circuit?.label ?? []))];
  return [
    t("activities.onTheWall", { time: clock(seconds, true) }),
    ...circuits.map((name) => t("activities.circuitNamed", { name })),
  ].join(" · ");
}

/** What a climbing set reads as anywhere a set shows: "20:00 · 18 laps", or "4 climbs · 3 sent". */
export const climbingSetText = (set: SetDone): string =>
  set.onS !== undefined ? wallChip(set) : climbsLine([set]);

/** "4 sets of 4 climbs", "2 × 20:00 on the wall", or "1 set" when a set runs until Done. */
export function climbingDoseLine(dose: Dose, measure: TallyMeasure): string {
  if (measure === "wallTime")
    return `${dose.sets} × ${t("activities.onTheWall", { time: clock(dose.onS ?? 0, true) })}`;
  return dose.reps === undefined
    ? t("activities.setCount", { count: dose.sets })
    : t("activities.setsOfClimbs", { count: dose.sets, climbs: dose.reps });
}

/** "Last time: 16 climbs · 13 sent · top V4", or null before there was a last time. */
export function climbingLastTime(sets: readonly SetDone[], measure: TallyMeasure): string | null {
  if (!isClimbingSets(sets)) return null;
  const summary = measure === "wallTime" ? wallLine(sets) : climbsLine(sets);
  return t("activities.lastTimeLine", { summary });
}
