import type { BuiltInLibrary, LibraryChange, LibraryEntry } from "@sendtally/api-client";
import { descriptionUnits } from "@sendtally/core/text";
import { EXERCISE_KINDS, type WorkoutKind } from "@sendtally/core/hang";

// Moderation is internal tooling: English only, no i18n.

export type LibraryFilter = "all" | "noDescription" | "retired";

export const LIBRARY_FILTERS: readonly LibraryFilter[] = ["all", "noDescription", "retired"];

const FILTER_LABELS: Record<LibraryFilter, string> = {
  all: "All",
  noDescription: "No description",
  retired: "Retired",
};

export const libraryFilterLabel = (filter: LibraryFilter): string => FILTER_LABELS[filter];

const CATEGORY: Record<WorkoutKind, string> = {
  climbing: "Climbing",
  hangboard: "Fingers",
  strength: "Strength",
  mobility: "Mobility",
  other: "Other",
};

/** The category a built-in sits in: a grip is a fingers exercise. */
export function entryKind(entry: LibraryEntry): WorkoutKind {
  return entry.type === "grip" ? "hangboard" : entry.spec.kind;
}

export const categoryLabel = (kind: WorkoutKind): string => CATEGORY[kind];

/** "Fingers exercise · built-in", above a built-in's name. */
export const entryKicker = (entry: LibraryEntry): string =>
  `${CATEGORY[entryKind(entry)]} ${entry.type === "workout" ? "workout" : "exercise"} · built-in`;

const matches = (entry: LibraryEntry, filter: LibraryFilter): boolean =>
  filter === "retired"
    ? entry.status === "retired"
    : entry.status === "active" && (filter === "all" || entry.description === "");

/** How many built-ins each filter shows; the tab counts the offered ones missing a description. */
export function filterCounts(library: BuiltInLibrary): Record<LibraryFilter, number> {
  const all = [...library.workouts, ...library.grips, ...library.exercises];
  return Object.fromEntries(
    LIBRARY_FILTERS.map((f) => [f, all.filter((e) => matches(e, f)).length])
  ) as Record<LibraryFilter, number>;
}

export type LibraryGroup = { title: string; entries: LibraryEntry[] };

/** The rows a filter shows, grouped as the apps do: workouts, then exercises by category. */
export function libraryGroups(library: BuiltInLibrary, filter: LibraryFilter): LibraryGroup[] {
  const shown = <T extends LibraryEntry>(entries: readonly T[]): T[] =>
    entries.filter((e) => matches(e, filter));
  return [
    { title: "Workouts", entries: shown(library.workouts) },
    { title: "Fingers exercises", entries: shown(library.grips) },
    ...EXERCISE_KINDS.map((kind) => ({
      title: `${CATEGORY[kind]} exercises`,
      entries: shown(library.exercises.filter((e) => e.spec.kind === kind)),
    })),
  ].filter((g) => g.entries.length > 0);
}

/** "2 paragraphs", "1 paragraph" or "list": what a description holds; null when it is empty. */
export function descriptionSummary(text: string): string | null {
  const units = descriptionUnits(text);
  if (units.length === 0) return null;
  if (units.some((u) => u.kind !== "paragraph")) return "list";
  return units.length === 1 ? "1 paragraph" : `${units.length} paragraphs`;
}

/** How many names a built-in has in other languages. */
export const otherNameCount = (entry: Pick<LibraryEntry, "translations">): number =>
  Object.values(entry.translations).filter((t) => (t?.name ?? "") !== "").length;

/** One line for a logged change: "Description edited", "Retired", "Name and other names edited". */
export function changeSummary({ before, after }: Pick<LibraryChange, "before" | "after">): string {
  if (before.status !== after.status) return after.status === "retired" ? "Retired" : "Unretired";
  const names = (s: typeof before): string =>
    JSON.stringify(Object.values(s.translations).map((t) => t?.name ?? ""));
  const edited = [
    before.name !== after.name && "name",
    before.description !== after.description && "description",
    names(before) !== names(after) && "other names",
  ].filter((part) => part !== false);
  if (edited.length === 0) return "Saved unchanged";
  const list =
    edited.length === 1 ? edited[0]! : `${edited.slice(0, -1).join(", ")} and ${edited.at(-1)!}`;
  return `${list[0]!.toUpperCase()}${list.slice(1)} edited`;
}
