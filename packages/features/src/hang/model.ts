import type { HangData, HangSessionRecord } from "@sendtally/api-client";
import {
  BUILT_IN_GRIP_NAMES,
  BUILT_IN_GRIPS,
  LIBRARY,
  lastSession,
  loadKey,
  resolveSetup,
  scheduledOn,
  type CalendarDate,
  type Grip,
  type HangSettings,
  type HangSetup,
  type Schedule,
  type SetupLayer,
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
  /**
   * The edge and weight a use starts from: the schedule's plan (given, or the one
   * landing on `date`), else the last session of this workout and grip, else what
   * the workout held before setups, else the kind's default.
   */
  setup: (
    w: Pick<Workout, "id" | "kind">,
    gripId: string,
    plan?: { schedule?: Schedule; date?: CalendarDate }
  ) => HangSetup;
  /** The last session's setup on this grip, or what it held before setups; null when never set. */
  lastUsed: (w: Pick<Workout, "id" | "kind">, gripId: string) => HangSetup | null;
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
    setup: (w, gripId, plan = {}) => {
      const schedule =
        plan.schedule ??
        (plan.date === undefined
          ? undefined
          : scheduledOn(data.schedules, plan.date).find(
              (s) => s.workoutId === w.id && s.gripId === gripId
            ));
      return resolveSetup(w.kind, [schedule, ...usedLayers(w.id, gripId)]);
    },
    lastUsed: (w, gripId) => {
      const used =
        lastSession(data.sessions, w.id, gripId) !== undefined ||
        loadKey(w.id, gripId) in data.loads;
      return used ? resolveSetup(w.kind, usedLayers(w.id, gripId)) : null;
    },
  };

  function usedLayers(workoutId: string, gripId: string): SetupLayer[] {
    return [
      lastSession(data.sessions, workoutId, gripId),
      {
        edgeMm: data.workouts.find((w) => w.id === workoutId)?.edgeMm,
        loadKg: data.loads[loadKey(workoutId, gripId)],
      },
    ];
  }
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
