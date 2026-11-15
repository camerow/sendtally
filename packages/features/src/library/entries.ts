import { entryText, type LibraryEntry } from "@sendtally/core/hang";
import { getLocale } from "../i18n";

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
