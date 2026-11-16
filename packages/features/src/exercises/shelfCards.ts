import type { Exercise } from "@sendtally/api-client";
import type { Grip, LibraryPicture, Workout, WorkoutKind } from "@sendtally/core/hang";
import { exerciseLabel, sourcePictures, unclaimedBuiltIns } from "./builtIns";
import { categoryShelves } from "./shelves";
import type { CategoryShelf, PickerSource } from "./types";
import { usedInText, workoutsWith } from "./wrapper";

/** One exercise on its category's shelf; `meta` is null while no workout uses it. */
export type ShelfCard = {
  key: string;
  kind: WorkoutKind;
  name: string;
  meta: string | null;
  /** A built-in the user has not made their own yet. */
  library: boolean;
  /** The first picture of the built-in it stands for, as its row's tile. */
  picture?: LibraryPicture;
  opens: { grip: string } | { exercise: string } | { builtIn: string };
};

export type ShelfWorld = {
  exercises: readonly Exercise[];
  grips: readonly Grip[];
  workouts: readonly Workout[];
};

/**
 * Train > Exercises: every category, each exercise with how many workouts use it, so an
 * exercise reads as a part and a workout as the whole. Fingers holds the user's own grips and
 * the built-in ones; every other category also holds the built-ins the user has not made their own.
 */
export function exerciseShelves(w: ShelfWorld): CategoryShelf<ShelfCard>[] {
  const card = (
    key: string,
    kind: WorkoutKind,
    name: string,
    source: PickerSource,
    opens: ShelfCard["opens"]
  ): ShelfCard => {
    const uses = workoutsWith(w.workouts, { kind, name, source }).length;
    return {
      key,
      kind,
      name,
      meta: uses === 0 ? null : usedInText(uses),
      library: "builtIn" in source,
      picture: sourcePictures(source)[0],
      opens,
    };
  };
  return categoryShelves([
    ...w.grips
      .filter((g) => !g.hidden)
      .map((g) => card(g.id, "hangboard", g.name, { grip: g }, { grip: g.id })),
    ...w.exercises
      .filter((e) => !e.archived)
      .map((e) => card(e.id, e.kind, exerciseLabel(e), { exercise: e }, { exercise: e.id })),
    ...unclaimedBuiltIns(w.exercises).map((b) =>
      card(`builtIn:${b.id}`, b.kind, b.name, { builtIn: b }, { builtIn: b.id })
    ),
  ]);
}

/** A shelf's first rows: the user's own before the library, ones in a workout first. */
export const shelfRows = <C extends Pick<ShelfCard, "meta" | "library">>(
  cards: readonly C[],
  rows: number
): C[] =>
  [...cards]
    .sort(
      (a, b) =>
        Number(a.library) - Number(b.library) || Number(a.meta === null) - Number(b.meta === null)
    )
    .slice(0, rows);
