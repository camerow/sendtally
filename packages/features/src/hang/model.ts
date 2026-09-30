import type { HangData, HangSessionRecord } from "@sendtally/api-client";
import {
  BUILT_IN_GRIP_NAMES,
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
    ...BUILT_IN_GRIPS.map((id) => ({
      id,
      name: builtInGripName(id),
      custom: false,
      hidden: false,
    })),
    ...data.grips,
  ];
  const byId = new Map(workouts.map((w) => [w.id, w]));
  const names = new Map(grips.map((g) => [g.id, g.name]));
  const hidden = new Set(grips.filter((g) => g.hidden).map((g) => g.id));
  return {
    data,
    settings: data.settings,
    workouts,
    grips,
    sessions: data.sessions,
    workout: (id) => byId.get(id),
    gripName: (id) => names.get(id) ?? id,
    defaultGrip: (w) => {
      const id = data.defaultGrips[w.id] ?? w.grip;
      return hidden.has(id) ? BUILT_IN_GRIPS[0] : id;
    },
    load: (w, gripId) => loadOf(data.loads, w, gripId),
  };
}

const nameKey = (name: string): string => name.trim().replace(/\s+/g, " ").toLowerCase();

/**
 * A grip that matches `name` ignoring case and spacing, the rule the server
 * keeps, so adding "half crimp" selects the built-in one. Deleted grips count.
 */
export function findGrip(grips: readonly Grip[], name: string): Grip | undefined {
  const wanted = nameKey(name);
  return grips.find((g) => nameKey(g.name) === wanted);
}

/**
 * The grip a rename of `gripId` to `name` collides with, by the server's rule: a
 * grip still in the pickers, or a built-in under its English name, which the
 * server checks whatever language the app shows.
 */
export function renameClash(
  grips: readonly Grip[],
  gripId: string,
  name: string
): Grip | undefined {
  const wanted = nameKey(name);
  const english = BUILT_IN_GRIPS.find((id) => nameKey(BUILT_IN_GRIP_NAMES[id]) === wanted);
  const clash =
    english === undefined
      ? findGrip(
          grips.filter((g) => !g.hidden),
          name
        )
      : grips.find((g) => g.id === english);
  return clash?.id === gripId ? undefined : clash;
}
