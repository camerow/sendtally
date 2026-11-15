import type { Grip } from "@sendtally/core/hang";
import { isBuiltInGrip } from "@sendtally/core/hang";
import { t, type MessageKey } from "../i18n";
import { currentLibrary } from "../library/current";
import { entryDescription, entryName, findEntry } from "../library/entries";

/** A built-in grip's name in the user's language, or its id when the library has none. */
export function builtInGripName(id: string): string {
  const entry = findEntry(currentLibrary().grips, id);
  return entry === undefined ? id : entryName(entry);
}

/** What a built-in grip's library entry says about it, in the user's language; nothing for a custom grip. */
export function gripDescription(id: string): string {
  const entry = findEntry(currentLibrary().grips, id);
  return entry === undefined ? "" : entryDescription(entry);
}

export function gripName(id: string, custom: readonly Grip[]): string {
  if (isBuiltInGrip(id)) return builtInGripName(id);
  return custom.find((g) => g.id === id)?.name ?? id;
}

const EFFORT_KEYS: readonly MessageKey[] = [
  "hang.effort1",
  "hang.effort2",
  "hang.effort3",
  "hang.effort4",
  "hang.effort5",
  "hang.effort6",
  "hang.effort7",
  "hang.effort8",
  "hang.effort9",
  "hang.effort10",
];

export function effortWord(rpe: number): string {
  return t(EFFORT_KEYS[rpe - 1] ?? "hang.effort1");
}
