import type { Exercise } from "@sendtally/api-client";
import type { LibraryPicture, WorkoutKind } from "@sendtally/core/hang";
import { gripDescription } from "../hang/names";
import { libraryPictures } from "../library/entries";
import { exerciseKey } from "../statistics/exercises";
import { builtInExercises, exerciseDescription, sourcePictures } from "./builtIns";
import type { PickerSource } from "./types";

/** What an info sheet shows: a workout's or an exercise's pictures and description. */
export type About = {
  kind: WorkoutKind;
  name: string;
  description: string;
  pictures: LibraryPicture[];
};

/** Whether there is anything for an info sheet to show. */
export const hasAbout = (about: About | undefined): about is About =>
  about !== undefined && (about.description !== "" || about.pictures.length > 0);

/** A workout's info: its own description, and its pictures when it is a built-in. */
export const workoutAbout = (w: {
  id: string;
  kind: WorkoutKind;
  name: string;
  description: string;
}): About => ({ ...w, pictures: libraryPictures("workout", w.id) });

/** The info of what a picker row adds: the user's exercise, a built-in or a grip. */
export function sourceAbout(entry: {
  kind: WorkoutKind;
  name: string;
  source: PickerSource;
}): About {
  const { source } = entry;
  const description =
    "grip" in source
      ? gripDescription(source.grip.id)
      : "builtIn" in source
        ? source.builtIn.description
        : exerciseDescription(source.exercise);
  return { kind: entry.kind, name: entry.name, description, pictures: sourcePictures(source) };
}

/**
 * The info of the exercise a workout item names, under the name shown: the user's own, else the
 * built-in of that name; none with neither a description nor a picture.
 */
export function exerciseAbout(
  exercises: readonly Exercise[] | null,
  name: string,
  shown: string
): About | undefined {
  const key = exerciseKey(name);
  const mine = exercises?.find((x) => exerciseKey(x.name) === key);
  const builtIn =
    mine === undefined ? builtInExercises().find((b) => exerciseKey(b.name) === key) : undefined;
  const about =
    mine !== undefined
      ? sourceAbout({ kind: mine.kind, name: shown, source: { exercise: mine } })
      : builtIn !== undefined
        ? sourceAbout({ kind: builtIn.kind, name: shown, source: { builtIn } })
        : undefined;
  return hasAbout(about) ? about : undefined;
}
