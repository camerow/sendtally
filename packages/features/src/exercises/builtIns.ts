import type { BuiltInExerciseEntry } from "@sendtally/api-client";
import { entryNames, type Dose } from "@sendtally/core/hang";
import { currentLibrary } from "../library/current";
import { entryDescription, entryName, findEntry, offered } from "../library/entries";
import type { BuiltInExercise } from "./types";

const builtInOf = (entry: BuiltInExerciseEntry): BuiltInExercise => ({
  id: entry.id,
  name: entryName(entry),
  description: entryDescription(entry),
  kind: entry.spec.kind,
  measure: entry.spec.measure,
});

/** A built-in exercise's name in the user's language, or its id when the library has none. */
export const builtInExerciseName = (id: string): string => {
  const entry = findEntry(currentLibrary().exercises, id);
  return entry === undefined ? id : entryName(entry);
};

/** The starter exercises the library offers, in the user's language. */
export const builtInExercises = (): BuiltInExercise[] =>
  offered(currentLibrary().exercises).map(builtInOf);

const nameKey = (name: string): string => name.trim().toLowerCase();

/** The built-ins the user has not made their own, by link or by a live exercise of the same name. */
export function unclaimedBuiltIns(
  mine: readonly { name: string; builtIn: string | null; archived: boolean }[]
): BuiltInExercise[] {
  const linked = new Set(mine.map((e) => e.builtIn));
  const taken = new Set(mine.filter((e) => !e.archived).map((e) => nameKey(e.name)));
  return builtInExercises().filter((b) => !linked.has(b.id) && !taken.has(nameKey(b.name)));
}

/** A built-in exercise by id, retired or not, in the user's language. */
export const builtInExercise = (id: string): BuiltInExercise | undefined => {
  const entry = findEntry(currentLibrary().exercises, id);
  return entry === undefined ? undefined : builtInOf(entry);
};

/** What a workout item of an exercise picked from the built-ins starts at, when it says. */
export const builtInDose = (builtIn: string | null): Dose | undefined =>
  findEntry(currentLibrary().exercises, builtIn)?.spec.dose;

/** What an exercise says about itself: the library's words for one picked from the built-ins, else its own. */
export function exerciseDescription(e: { description: string; builtIn: string | null }): string {
  const entry = findEntry(currentLibrary().exercises, e.builtIn);
  return entry === undefined ? e.description : entryDescription(entry);
}

/** An exercise as the user reads it: one picked from the built-ins in their language, until they rename it. */
export function exerciseLabel(e: { name: string; builtIn: string | null }): string {
  const entry = findEntry(currentLibrary().exercises, e.builtIn);
  if (entry === undefined) return e.name;
  const renamed = !entryNames(entry).some((name) => nameKey(name) === nameKey(e.name));
  return renamed ? e.name : entryName(entry);
}
