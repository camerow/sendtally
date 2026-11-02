import type { Exercise } from "@sendtally/api-client";
import type { Grip } from "@sendtally/core/hang";
import { builtInExercises, exerciseLabel } from "./builtIns";
import type { PickerEntry, PickerFilter } from "./types";

export type PickerWorld = {
  mine: readonly Exercise[];
  /** The grips the user can pick, hidden ones left out. */
  grips: readonly Grip[];
  /** Sessions logged, by lowercased exercise name and by grip id. */
  uses: ReadonlyMap<string, number>;
  /** What the workout's items name: exercise names, or grip ids. */
  inWorkout: readonly string[];
  /** A Fingers workout picks grips, which the hang timer runs; any other picks everything else. */
  fingers: boolean;
};

const fold = (text: string): string =>
  text.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();

const nameKey = (name: string): string => name.trim().toLowerCase();

/** Everything the workout can add, built-ins the user has not made their own included. */
function allEntries(world: PickerWorld): PickerEntry[] {
  const listed = new Set(world.inWorkout.map(nameKey));
  if (world.fingers)
    return world.grips.map((grip) => ({
      key: `grip:${grip.id}`,
      kind: "hangboard",
      name: grip.name,
      uses: world.uses.get(grip.id) ?? 0,
      library: false,
      inWorkout: listed.has(nameKey(grip.id)),
      source: { grip },
    }));
  const mine = world.mine.filter((e) => !e.archived);
  const taken = new Set(mine.map((e) => nameKey(e.name)));
  const linked = new Set(world.mine.map((e) => e.builtIn));
  return [
    ...mine.map((exercise): PickerEntry => ({
      key: `mine:${exercise.id}`,
      kind: exercise.kind,
      name: exerciseLabel(exercise),
      uses: world.uses.get(nameKey(exercise.name)) ?? 0,
      library: false,
      inWorkout: listed.has(nameKey(exercise.name)),
      source: { exercise },
    })),
    ...builtInExercises()
      .filter((b) => !linked.has(b.id) && !taken.has(nameKey(b.name)))
      .map((builtIn): PickerEntry => ({
        key: `builtIn:${builtIn.id}`,
        kind: builtIn.kind,
        name: builtIn.name,
        uses: world.uses.get(nameKey(builtIn.name)) ?? 0,
        library: true,
        inWorkout: listed.has(nameKey(builtIn.name)),
        source: { builtIn },
      })),
  ];
}

/**
 * The picker's rows for a category, or all, and what was typed: the most used first, the
 * user's own before the starter library, then by name.
 */
export function pickerEntries(world: PickerWorld, filter: PickerFilter): PickerEntry[] {
  const words = fold(filter.text).split(/\s+/).filter(Boolean);
  return allEntries(world)
    .filter((e) => filter.category === "all" || e.kind === filter.category)
    .filter((e) => words.every((w) => fold(e.name).includes(w)))
    .sort(
      (a, b) =>
        b.uses - a.uses || Number(a.library) - Number(b.library) || a.name.localeCompare(b.name)
    );
}

/** The entry already named this, in any category and any case: what New picks instead of a duplicate. */
export function entryNamed(world: PickerWorld, name: string): PickerEntry | undefined {
  const key = fold(name);
  return allEntries(world).find(
    (e) => fold(e.name) === key || ("exercise" in e.source && fold(e.source.exercise.name) === key)
  );
}
