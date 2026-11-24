import type { BuiltInLibrary, LibraryChange, LibraryEntry } from "@sendtally/api-client";
import { descriptionUnits } from "@sendtally/core/text";
import { EXERCISE_KINDS, type WorkoutKind } from "@sendtally/core/hang";

// Moderation is internal tooling: English only, no i18n.

export type LibraryFilter = "all" | "noDescription" | "noPicture" | "retired";

export const LIBRARY_FILTERS: readonly LibraryFilter[] = [
  "all",
  "noDescription",
  "noPicture",
  "retired",
];

const FILTER_LABELS: Record<LibraryFilter, string> = {
  all: "All",
  noDescription: "No description",
  noPicture: "No picture",
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

const LACKS: Record<Exclude<LibraryFilter, "retired">, (entry: LibraryEntry) => boolean> = {
  all: () => true,
  noDescription: (e) => e.description === "",
  noPicture: (e) => e.media.length === 0,
};

const matches = (entry: LibraryEntry, filter: LibraryFilter): boolean =>
  filter === "retired"
    ? entry.status === "retired"
    : entry.status === "active" && LACKS[filter](entry);

/** The admin count: offered built-ins missing a description or a picture. */
export const libraryGapCount = (library: BuiltInLibrary): number =>
  [...library.workouts, ...library.grips, ...library.exercises].filter(
    (e) => matches(e, "noDescription") || matches(e, "noPicture")
  ).length;

/** "No picture", "1 picture" or "3 pictures": the pictures the apps show. */
export const pictureSummary = (entry: LibraryEntry): string =>
  entry.media.length === 0
    ? "No picture"
    : `${entry.media.length} picture${entry.media.length === 1 ? "" : "s"}`;

/** How many built-ins each filter shows. */
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

type Change = Pick<LibraryChange, "before" | "after">;

/** Whether a change is a built-in's creation, which starts from no name. */
const created = (change: Change): boolean => change.before.name === "";

const pictureIds = (s: Change["before"]): string[] => (s.media ?? []).map((m) => m.id);

/** One line for a change to a built-in's pictures, or null when it changed none. */
function pictureChange({ before, after }: Change): string | null {
  if (before.media === undefined || after.media === undefined) return null;
  const was = pictureIds(before);
  const now = pictureIds(after);
  if (now.length > was.length) return "Picture added";
  if (now.length < was.length) return "Picture deleted";
  // The first place the order differs holds a picture from further down, which moved up.
  const moved = now.findIndex((id, i) => id !== was[i]);
  if (moved !== -1) return `Picture ${was.indexOf(now[moved]!) + 1} moved up`;
  const at = after.media.findIndex(
    (m, i) => JSON.stringify(m) !== JSON.stringify(before.media![i])
  );
  if (at === -1) return "Saved unchanged";
  const field = after.media[at]!.alt !== before.media[at]!.alt ? "alt text" : "credit";
  return `Picture ${at + 1} ${field} edited`;
}

/**
 * What a change offers: Restore puts it back; a deleted picture's file is gone, so it is
 * permanent, and an added one is undone by deleting it.
 */
export function changeRestore(change: Change): "restore" | "permanent" | null {
  if (created(change)) return null;
  const summary = pictureChange(change);
  if (summary === "Picture deleted") return "permanent";
  return summary === "Picture added" ? null : "restore";
}

/** One line for a logged change: "Description edited", "Retired", "Picture 2 moved up". */
export function changeSummary(change: Change): string {
  if (created(change)) return "Created";
  const pictures = pictureChange(change);
  if (pictures !== null) return pictures;
  const { before, after } = change;
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
