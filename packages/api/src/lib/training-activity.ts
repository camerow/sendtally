import { toUnit, type ItemDone, type SetDone, type WeightUnit } from "@sendtally/core/hang";
import type { Activity, ActivityKind } from "./activities";
import type { StravaActivity, StravaSportType } from "./strava";

const SPORT_TYPES: Record<ActivityKind, StravaSportType> = {
  strength: "WeightTraining",
  mobility: "Workout",
  other: "Workout",
};

/** "5×100 kg", "30s", leaving out what the set does not have. */
function setLine(set: SetDone, unit: WeightUnit): string {
  const load = set.weightKg === undefined ? undefined : `${toUnit(set.weightKg, unit)} ${unit}`;
  const work = [set.reps, load].filter((p) => p !== undefined).join("×");
  return [work, set.onS === undefined ? "" : `${set.onS}s`].filter((p) => p !== "").join(" ");
}

/** Each item with the sets done, or ticked when its sets carry no numbers. */
function doneLines(done: readonly ItemDone[], unit: WeightUnit): string[] {
  return done.flatMap((d) => {
    if (d.sets.length === 0) return [];
    const sets = d.sets.map((s) => setLine(s, unit)).filter((line) => line !== "");
    return [sets.length === 0 ? `✓ ${d.exercise}` : `${d.exercise} ${sets.join(", ")}`];
  });
}

// As for climbing and hangboard sessions, the effort rides in the description's
// first line because Strava's public API drops perceived_exertion.
export function trainingDescription(a: Activity, unit: WeightUnit): string {
  return [
    ...(a.rpe === null ? [] : [`RPE ${a.rpe}/10`]),
    "created by https://sendtally.com",
    ...doneLines(a.done, unit),
  ].join("\n");
}

// An activity with no start time lands at local noon on its day, as a hang session does.
export function trainingActivity(a: Activity, unit: WeightUnit): StravaActivity {
  return {
    name: a.title,
    description: trainingDescription(a, unit),
    sportType: SPORT_TYPES[a.kind],
    startDateLocal: new Date(`${a.date}T${a.startTime ?? "12:00"}:00Z`),
    elapsedSeconds: a.minutes * 60,
  };
}
