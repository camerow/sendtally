import type { Exercise } from "@sendtally/api-client";
import { exerciseNameKey, isBuiltInGrip, type Grip, type WorkoutKind } from "@sendtally/core/hang";
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
  /** Grips play in the hang timer and log as hang sessions, so a workout holds only grips or none. */
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

/**
 * What a workout can add next, read off what it holds and what is ticked: grips once a grip is
 * in, everything else once anything else is, and both while it holds nothing.
 */
export function pickerOffer(
  world: Pick<PickerWorld, "grips">,
  exercises: readonly string[]
): PickerOffer {
  const [first] = exercises;
  if (first === undefined) return "all";
  return isGripOf(world)(first) ? "grips" : "exercises";
}

/** The category an item's exercise is in, or undefined for a name the library does not know. */
export function exerciseKindIn(
  world: Pick<PickerWorld, "grips" | "mine">
): (exercise: string) => WorkoutKind | undefined {
  const isGrip = isGripOf(world);
  const kinds = new Map<string, WorkoutKind>([
    ...currentLibrary().exercises.map((b) => [exerciseNameKey(b.name), b.spec.kind] as const),
    ...world.mine.map((e) => [exerciseNameKey(e.name), e.kind] as const),
  ]);
  return (exercise) => (isGrip(exercise) ? "hangboard" : kinds.get(exerciseNameKey(exercise)));
}

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
