import type { HangData, HangSessionRecord } from "@sendtally/api-client";
import {
  BUILT_IN_GRIPS,
  LIBRARY,
  loadOf,
  type Grip,
  type HangSettings,
  type Workout,
} from "@sendtally/core/hang";
import { builtInGripName, workoutName } from "./names";

/** Everything the app reads, with library and built-in names in the user's language. */
export type HangModel = {
  data: HangData;
  settings: HangSettings;
  workouts: Workout[];
  grips: Grip[];
  sessions: HangSessionRecord[];
  workout: (id: string) => Workout | undefined;
  gripName: (id: string) => string;
  defaultGrip: (w: Workout) => string;
  load: (w: Pick<Workout, "id" | "kind">, gripId: string) => number;
};

export function hangModel(data: HangData): HangModel {
  const workouts = [...LIBRARY.map((w) => ({ ...w, name: workoutName(w) })), ...data.workouts];
  const grips = [
    ...BUILT_IN_GRIPS.map((id) => ({ id, name: builtInGripName(id), custom: false })),
    ...data.grips,
  ];
  const byId = new Map(workouts.map((w) => [w.id, w]));
  const names = new Map(grips.map((g) => [g.id, g.name]));
  return {
    data,
    settings: data.settings,
    workouts,
    grips,
    sessions: data.sessions,
    workout: (id) => byId.get(id),
    gripName: (id) => names.get(id) ?? id,
    defaultGrip: (w) => data.defaultGrips[w.id] ?? w.grip,
    load: (w, gripId) => loadOf(data.loads, w, gripId),
  };
}

/** A grip that matches `name` ignoring case, so adding "half crimp" selects the built-in one. */
export function findGrip(grips: readonly Grip[], name: string): Grip | undefined {
  const wanted = name.trim().toLowerCase();
  return grips.find((g) => g.name.toLowerCase() === wanted);
}
