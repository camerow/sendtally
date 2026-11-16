import {
  entryText,
  type LibraryEntry,
  type LibraryPicture,
  type LibraryType,
} from "@sendtally/core/hang";
import { getLocale } from "../i18n";
import { currentLibrary } from "./current";

/** An entry's name in the user's language. */
export const entryName = (entry: LibraryEntry): string => entryText(entry, getLocale()).name;

/** An entry's description in the user's language. */
export const entryDescription = (entry: LibraryEntry): string =>
  entryText(entry, getLocale()).description;

/** What a library offers: the entries not retired, in order. */
export const offered = <T extends LibraryEntry>(entries: readonly T[]): T[] =>
  entries.filter((e) => e.status === "active");

export const findEntry = <T extends LibraryEntry>(
  entries: readonly T[],
  id: string | null
): T | undefined => entries.find((e) => e.id === id);

const SHELVES = { exercise: "exercises", grip: "grips", workout: "workouts" } as const;

/** A built-in's pictures, the first leading; none for an id that is not a built-in's. */
export const libraryPictures = (type: LibraryType, id: string | null): LibraryPicture[] =>
  findEntry<LibraryEntry>(currentLibrary()[SHELVES[type]], id)?.media ?? [];
