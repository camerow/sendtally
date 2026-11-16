import { z } from "zod";
import {
  BUILT_IN_GRIPS,
  EXERCISE_KINDS,
  EXERCISE_MEASURES,
  FOCI,
  LIBRARY_TYPES,
  TRANSLATED_LOCALES,
  WORKOUT_KINDS,
  type BuiltInLibrary,
  type LibraryEntry,
  type LibraryTranslations,
} from "@sendtally/core/hang";
import type { libraryItems } from "../db/schema";
import { description, dose, title } from "./plan";

const text = z.object({ name: z.string().optional(), description: z.string().optional() });

const translations = z.partialRecord(z.enum(TRANSLATED_LOCALES), text);

const exerciseSpec = z.object({
  kind: z.enum(EXERCISE_KINDS),
  measure: z.enum(EXERCISE_MEASURES),
  dose: dose.optional(),
});

const doses = z.array(dose);

const itemSpec = z.union([
  z.object({ grip: z.enum(BUILT_IN_GRIPS), doses }),
  z.object({ exercise: z.string(), doses }),
  z.object({ step: z.enum(["hard", "easy"]), doses }),
]);

const workoutSpec = z.object({
  kind: z.enum(WORKOUT_KINDS),
  focus: z.enum(FOCI).nullable(),
  minutes: z.number().nullable(),
  targetRpe: z.number().nullable(),
  items: z.array(itemSpec),
});

export const libraryType = z.enum(LIBRARY_TYPES);

export const libraryParam = z.object({ type: libraryType, id: z.string().min(1).max(64) });

/**
 * A moderator's edit to a built-in: its English text, the names it goes by in other languages,
 * and whether it is offered. Translated descriptions have no field, so they are kept only while
 * the English one stays the same.
 */
export const libraryEditBody = z.object({
  name: title,
  description,
  names: z.partialRecord(z.enum(TRANSLATED_LOCALES), z.string().trim().max(80)),
  status: z.enum(["active", "retired"]),
});

export type LibraryEdit = z.infer<typeof libraryEditBody>;

/** What a change records and Restore writes back. */
export type LibraryState = Pick<LibraryEntry, "name" | "description" | "translations" | "status">;

type Row = typeof libraryItems.$inferSelect;

export function entryOf(row: Row): LibraryEntry {
  const base = {
    id: row.id,
    status: row.status,
    name: row.name,
    description: row.description ?? "",
    translations: translations.parse(JSON.parse(row.translations)),
    updatedAt: row.updated_at,
  };
  const spec: unknown = JSON.parse(row.spec);
  if (row.type === "exercise") return { ...base, type: "exercise", spec: exerciseSpec.parse(spec) };
  if (row.type === "workout") return { ...base, type: "workout", spec: workoutSpec.parse(spec) };
  return { ...base, type: "grip" };
}

/** The library from its rows, each kind in its order. */
export function libraryOf(rows: readonly Row[]): BuiltInLibrary {
  const library: BuiltInLibrary = { exercises: [], grips: [], workouts: [] };
  for (const row of [...rows].sort((a, b) => a.position - b.position)) {
    const entry = entryOf(row);
    if (entry.type === "exercise") library.exercises.push(entry);
    else if (entry.type === "workout") library.workouts.push(entry);
    else library.grips.push(entry);
  }
  return library;
}

export const stateOf = (e: LibraryEntry): LibraryState => ({
  name: e.name,
  description: e.description,
  translations: e.translations,
  status: e.status,
});

/** An entry after an edit: a changed English description drops the translated ones. */
export function editedState(before: LibraryState, edit: LibraryEdit): LibraryState {
  const keepDescriptions = edit.description === before.description;
  const translations: LibraryTranslations = {};
  for (const locale of TRANSLATED_LOCALES) {
    const name = edit.names[locale] ?? "";
    const description = keepDescriptions ? (before.translations[locale]?.description ?? "") : "";
    if (name !== "" || description !== "") {
      translations[locale] = {
        ...(name === "" ? {} : { name }),
        ...(description === "" ? {} : { description }),
      };
    }
  }
  return { name: edit.name, description: edit.description, translations, status: edit.status };
}

export const libraryState = z.object({
  name: z.string(),
  description: z.string(),
  translations,
  status: z.enum(["active", "retired"]),
});
