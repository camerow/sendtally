import type { Exercise } from "@sendtally/api-client";
import {
  WORKOUT_KINDS,
  exerciseKinds,
  isBuiltInGrip,
  joinsGroup,
  type Grip,
  type WorkoutKind,
} from "@sendtally/core/hang";
import { currentLibrary } from "../library/current";
import { exerciseLabel, unclaimedBuiltIns } from "./builtIns";
import { categoryShelves } from "./shelves";
import type { CategoryShelf, PickerEntry, PickerFilter } from "./types";

/** What a picker offers: grips only, everything but grips, or both. */
export type PickerOffer = "grips" | "exercises" | "all";

export type PickerWorld = {
  mine: readonly Exercise[];
  /** The user's grips, hidden ones too; the picker leaves those out. */
  grips: readonly Grip[];
  /** Sessions logged, by lowercased exercise name and by grip id. */
  uses: ReadonlyMap<string, number>;
  /** What the workout's items name: exercise names, or grip ids. */
  inWorkout: readonly string[];
  /** Grips only for a grip's own pickers; a workout's picker offers everything. */
  offer: PickerOffer;
};

const fold = (text: string): string =>
  text.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();

const nameKey = (name: string): string => name.trim().toLowerCase();

/** Whether a workout item names a grip, by its id. */
export const isGripOf =
  (world: Pick<PickerWorld, "grips">) =>
  (exercise: string): boolean =>
    isBuiltInGrip(exercise) || world.grips.some((g) => g.id === exercise);

/** The category an item's exercise is in, or undefined for a name the library does not know. */
export function exerciseKindIn(
  world: Pick<PickerWorld, "grips" | "mine">
): (exercise: string) => WorkoutKind | undefined {
  const builtIns = currentLibrary().exercises.map((b) => ({ name: b.name, kind: b.spec.kind }));
  return exerciseKinds([...builtIns, ...world.mine], isGripOf(world));
}

/**
 * What a picker shows: grips and every other exercise side by side in every category, and the
 * category New makes in from the one in view, "choose" when it has to ask.
 */
export const pickerState = (
  category: WorkoutKind | "all",
  superset = false
): { offer: PickerOffer; kinds: readonly WorkoutKind[]; newKind: WorkoutKind | "choose" } => ({
  offer: "all",
  kinds: WORKOUT_KINDS.filter((k) => !superset || kindJoins(k)),
  newKind: category === "all" ? "choose" : category,
});

/** Whether exercises of a category can be in a superset, by `joinsGroup`'s rule. */
const kindJoins = (kind: WorkoutKind): boolean => joinsGroup({ exercise: "" }, () => kind);

/** Everything the workout can add, built-ins the user has not made their own included. */
function allEntries(world: PickerWorld): PickerEntry[] {
  const listed = new Set(world.inWorkout.map(nameKey));
  const grips = world.grips
    .filter((g) => !g.hidden)
    .map((grip): PickerEntry => ({
      key: `grip:${grip.id}`,
      kind: "hangboard",
      name: grip.name,
      uses: world.uses.get(grip.id) ?? 0,
      library: false,
      inWorkout: listed.has(nameKey(grip.id)),
      source: { grip },
    }));
  const mine = world.mine.filter((e) => !e.archived);
  const exercises = [
    ...mine.map((exercise): PickerEntry => ({
      key: `mine:${exercise.id}`,
      kind: exercise.kind,
      name: exerciseLabel(exercise),
      uses: world.uses.get(nameKey(exercise.name)) ?? 0,
      library: false,
      inWorkout: listed.has(nameKey(exercise.name)),
      source: { exercise },
    })),
    ...unclaimedBuiltIns(world.mine).map((builtIn): PickerEntry => ({
      key: `builtIn:${builtIn.id}`,
      kind: builtIn.kind,
      name: builtIn.name,
      uses: world.uses.get(nameKey(builtIn.name)) ?? 0,
      library: true,
      inWorkout: listed.has(nameKey(builtIn.name)),
      source: { builtIn },
    })),
  ];
  return [
    ...(world.offer === "exercises" ? [] : grips),
    ...(world.offer === "grips" ? [] : exercises),
  ];
}

/**
 * The picker's rows for a category, or all, and what was typed: grips and exercises in one
 * list, the most used first, then by name.
 */
export function pickerEntries(world: PickerWorld, filter: PickerFilter): PickerEntry[] {
  const words = fold(filter.text).split(/\s+/).filter(Boolean);
  return allEntries(world)
    .filter((e) => filter.superset !== true || kindJoins(e.kind))
    .filter((e) => filter.category === "all" || e.kind === filter.category)
    .filter((e) => words.every((w) => fold(e.name).includes(w)))
    .sort((a, b) => b.uses - a.uses || a.name.localeCompare(b.name));
}

/** The entry already named this, in any category and any case: what New picks instead of a duplicate. */
export function entryNamed(world: PickerWorld, name: string): PickerEntry | undefined {
  const key = fold(name);
  return allEntries(world).find(
    (e) => fold(e.name) === key || ("exercise" in e.source && fold(e.source.exercise.name) === key)
  );
}

/** Every exercise and grip matching what was typed, by category, empty categories left out. */
export function entryShelves(world: PickerWorld, text: string): CategoryShelf<PickerEntry>[] {
  const all = { category: "all", text } as const;
  return categoryShelves(pickerEntries({ ...world, offer: "all" }, all)).filter(
    (s) => s.entries.length > 0
  );
}
