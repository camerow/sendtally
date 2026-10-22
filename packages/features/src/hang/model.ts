import type { HangData, HangSessionRecord } from "@sendtally/api-client";
import {
  BUILT_IN_GRIP_NAMES,
  BUILT_IN_GRIPS,
  doseProtocol,
  lastSession,
  loadKey,
  protocolDose,
  resolveSetup,
  timeUnitsOf,
  type Dose,
  type Grip,
  type HangSettings,
  type HangSetup,
  type HangWorkout,
  type Item,
  type SetupLayer,
} from "@sendtally/core/hang";
import type { LibraryWorkout, WorkoutDraft } from "../workouts/types";
import { builtInGripName } from "./names";

/** Everything the hang timer reads, with built-in names in the user's language. */
export type HangModel = {
  data: HangData;
  settings: HangSettings;
  /** Every hangboard workout in the library, as the timer runs its first item. */
  workouts: HangWorkout[];
  grips: Grip[];
  sessions: HangSessionRecord[];
  /** A hangboard workout's variation as the timer runs its first item; the first by default. */
  workout: (id: string, variation?: number) => HangWorkout | undefined;
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
  item: Item
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

/** One item of a hangboard workout as the timer runs it, or null when it has no such item. */
export function hangWorkoutOf(
  w: Pick<LibraryWorkout, "id" | "source" | "kind" | "name" | "variations">,
  variation = 0,
  item = 0
): HangWorkout | null {
  const found = w.kind === "hangboard" ? w.variations[variation]?.items[item] : undefined;
  return found === undefined ? null : hangWorkoutFromItem(w, found);
}

/**
 * A workout with its first item set to what the hangboard builder made: its grip and
 * protocol, keeping the edge and weight the item already had.
 */
export function withHangWorkout(base: WorkoutDraft, h: HangWorkout): WorkoutDraft {
  const [first, ...rest] = base.variations;
  const kept = first?.items[0]?.dose;
  const dose: Dose = {
    ...protocolDose(h),
    ...(kept?.edgeMm === undefined ? {} : { edgeMm: kept.edgeMm }),
    ...(kept?.weightKg === undefined ? {} : { weightKg: kept.weightKg }),
  };
  const item = { exercise: h.grip, dose };
  return {
    ...base,
    kind: "hangboard",
    name: h.name,
    variations: [
      { label: first?.label ?? "", items: [item, ...(first?.items.slice(1) ?? [])] },
      ...rest,
    ],
  };
}

export function hangModel(data: HangData, library: readonly LibraryWorkout[]): HangModel {
  const workouts = library.flatMap((w) => hangWorkoutOf(w) ?? []);
  const grips = [
    ...BUILT_IN_GRIPS.map((id) => ({
      id,
      name: builtInGripName(id),
      custom: false,
      hidden: false,
    })),
    ...data.grips,
  ];
  const hangboard = new Map(library.filter((w) => w.kind === "hangboard").map((w) => [w.id, w]));
  const names = new Map(grips.map((g) => [g.id, g.name]));
  const hidden = new Set(grips.filter((g) => g.hidden).map((g) => g.id));
  return {
    data,
    settings: data.settings,
    workouts,
    grips,
    sessions: data.sessions,
    workout: (id, variation = 0) => {
      const w = hangboard.get(id);
      return w === undefined ? undefined : (hangWorkoutOf(w, variation) ?? undefined);
    },
    gripName: (id) => names.get(id) ?? id,
    defaultGrip: (w) => {
      const id = data.defaultGrips[w.id] ?? w.grip;
      return hidden.has(id) ? BUILT_IN_GRIPS[0] : id;
    },
    setup: (w, gripId, planned) =>
      resolveSetup(w.kind, [
        planned === undefined ? null : { edgeMm: planned.edgeMm, loadKg: planned.weightKg },
        ...usedLayers(w.id, gripId),
      ]),
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
