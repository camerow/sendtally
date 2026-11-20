import type { HangData, HangPart, HangSessionRecord } from "@sendtally/api-client";
import {
  BUILT_IN_GRIPS,
  doseIndex,
  doseProtocol,
  isBuiltInGrip,
  lastSession,
  loadKey,
  resolveSetup,
  timeUnitsOf,
  type Dose,
  type Grip,
  type HangSettings,
  type HangSetup,
  type HangWorkout,
  type SessionItem,
  type SetupLayer,
} from "@sendtally/core/hang";
import type { LibraryWorkout } from "../workouts/types";
import { currentLibrary } from "../library/current";
import { gripRuns } from "../activities/summary";
import { builtInGripName } from "./names";

/** Everything the hang timer reads, with built-in names in the user's language. */
export type HangModel = {
  data: HangData;
  settings: HangSettings;
  /** Every hangboard workout in the library, as the timer runs its first item. */
  workouts: HangWorkout[];
  grips: Grip[];
  /** Sessions of their own and workouts' fingerboard parts, for what grips read. */
  sessions: (HangSessionRecord | HangPart)[];
  /** A hangboard workout as the timer runs its first item. */
  workout: (id: string) => HangWorkout | undefined;
  gripName: (id: string) => string;
  defaultGrip: (w: HangWorkout) => string;
  /**
   * The edge and weight a use starts from: what the plan prescribes, else the last
   * session of this workout and grip, else the kind's default.
   */
  setup: (
    w: Pick<HangWorkout, "id" | "kind">,
    gripId: string,
    planned?: Pick<Dose, "edgeMm" | "weightKg">
  ) => HangSetup;
  /** The last session's setup on this grip; null when never set. */
  lastUsed: (w: Pick<HangWorkout, "id" | "kind">, gripId: string) => HangSetup | null;
};

/** One hangboard item as the timer runs it: on its grip, under the workout's name. */
export function hangWorkoutFromItem(
  w: Pick<LibraryWorkout, "id" | "source" | "name">,
  item: SessionItem
): HangWorkout {
  const protocol = doseProtocol(w.name, item.dose);
  return {
    ...protocol,
    id: w.id,
    source: w.source,
    grip: item.exercise,
    timeUnits: timeUnitsOf(protocol),
  };
}

/**
 * The first item of a hangboard workout as session `session` of it runs, the first by
 * default, or null when it has none.
 */
export function hangWorkoutOf(
  w: Pick<LibraryWorkout, "id" | "source" | "kind" | "name" | "items">,
  session = 0
): HangWorkout | null {
  const [first] = w.kind === "hangboard" ? w.items : [];
  const dose = first?.doses[doseIndex(first, session)];
  return first === undefined || dose === undefined
    ? null
    : hangWorkoutFromItem(w, { exercise: first.exercise, dose });
}

/**
 * The hang timer's model. A built-in grip the library retired is hidden like one the user hid,
 * so it leaves the pickers but still names its sessions.
 */
export const hangsWithParts = (
  data: Pick<HangData, "sessions" | "parts">
): (HangSessionRecord | HangPart)[] =>
  [...data.sessions, ...data.parts]
    .flatMap((s) => gripRuns<HangSessionRecord | HangPart>(s))
    .sort((a, b) => b.date.localeCompare(a.date));

export function hangModel(data: HangData, all: readonly LibraryWorkout[]): HangModel {
  const workouts = all.flatMap((w) => hangWorkoutOf(w) ?? []);
  const hangs = hangsWithParts(data);
  const grips = [
    ...currentLibrary().grips.flatMap((entry) => {
      if (!isBuiltInGrip(entry.id)) return [];
      const own = data.grips.find((g) => g.id === entry.id);
      return {
        ...own,
        hidden: entry.status === "retired" || own?.hidden === true,
        id: entry.id,
        name: builtInGripName(entry.id),
        custom: false,
      };
    }),
    ...data.grips.filter((g) => !isBuiltInGrip(g.id)),
  ];
  const hangboard = new Map(all.filter((w) => w.kind === "hangboard").map((w) => [w.id, w]));
  const names = new Map(grips.map((g) => [g.id, g.name]));
  const hidden = new Set(grips.filter((g) => g.hidden).map((g) => g.id));
  return {
    data,
    settings: data.settings,
    workouts,
    grips,
    sessions: hangs,
    workout: (id) => {
      const w = hangboard.get(id);
      return w === undefined ? undefined : (hangWorkoutOf(w) ?? undefined);
    },
    gripName: (id) => names.get(id) ?? id,
    defaultGrip: (w) => {
      const id = data.defaultGrips[w.id] ?? w.grip;
      return hidden.has(id) ? BUILT_IN_GRIPS[0] : id;
    },
    setup: (w, gripId, planned) =>
      resolveSetup(
        w.kind,
        [
          planned === undefined ? null : { edgeMm: planned.edgeMm, loadKg: planned.weightKg },
          ...usedLayers(w.id, gripId),
        ],
        data.settings.units
      ),
    lastUsed: (w, gripId) => {
      const used =
        lastSession(hangs, w.id, gripId) !== undefined || loadKey(w.id, gripId) in data.loads;
      return used ? resolveSetup(w.kind, usedLayers(w.id, gripId), data.settings.units) : null;
    },
  };

  function usedLayers(workoutId: string, gripId: string): SetupLayer[] {
    return [
      lastSession(hangs, workoutId, gripId),
      { loadKg: data.loads[loadKey(workoutId, gripId)] },
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
  const english = currentLibrary().grips.find((g) => nameKey(g.name) === wanted)?.id;
  const clash =
    english === undefined
      ? findGrip(
          grips.filter((g) => !g.hidden),
          name
        )
      : grips.find((g) => g.id === english);
  return clash?.id === gripId ? undefined : clash;
}
