import { toUnit, type WeightUnit } from "@sendtally/core/hang";
import type { Activity, ActivityDetail, ActivityKind } from "./activities";
import type { StravaActivity, StravaSportType } from "./strava";

const SPORT_TYPES: Record<ActivityKind, StravaSportType> = {
  strength: "WeightTraining",
  mobility: "Workout",
  run: "Run",
  yoga: "Yoga",
  other: "Workout",
};

type ExerciseSet = Extract<ActivityDetail, { kind: "sets" }>["exercises"][number]["sets"][number];

/** "5×100 kg", "30s L", leaving out what the set does not have. */
function setLine(set: ExerciseSet, unit: WeightUnit): string {
  const load = set.loadKg === undefined ? undefined : `${toUnit(set.loadKg, unit)} ${unit}`;
  const work = [set.reps, load].filter((p) => p !== undefined).join("×");
  return [work, set.seconds === undefined ? "" : `${set.seconds}s`, set.side ?? ""]
    .filter((p) => p !== "")
    .join(" ");
}

/** What was done: each exercise with its done sets, or the ticked checklist items. */
function detailLines(detail: ActivityDetail | null, unit: WeightUnit): string[] {
  if (detail === null) return [];
  if (detail.kind === "checklist") {
    return detail.items
      .filter((i) => i.done)
      .map((i) => (i.dose === "" ? `✓ ${i.text}` : `✓ ${i.text} ${i.dose}`));
  }
  return detail.exercises.flatMap((e) => {
    const sets = e.sets.filter((s) => s.done).map((s) => setLine(s, unit));
    return sets.length === 0 ? [] : [`${e.name} ${sets.join(", ")}`];
  });
}

// As for climbing and hangboard sessions, the effort rides in the description's
// first line because Strava's public API drops perceived_exertion.
export function trainingDescription(a: Activity, unit: WeightUnit): string {
  return [
    ...(a.rpe === null ? [] : [`RPE ${a.rpe}/10`]),
    "created by https://sendtally.com",
    ...detailLines(a.detail, unit),
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
