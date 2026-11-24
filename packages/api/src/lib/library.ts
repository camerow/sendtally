import { z } from "zod";
import {
  BUILT_IN_GRIPS,
  EXERCISE_KINDS,
  EXERCISE_MEASURES,
  FOCI,
  LIBRARY_TYPES,
  TRANSLATED_LOCALES,
  WORKOUT_KINDS,
  measuresFor,
  type BuiltInExerciseSpec,
  type BuiltInLibrary,
  type BuiltInWorkoutSpec,
  type LibraryEntry,
  type LibraryPicture,
  type LibraryTranslations,
} from "@sendtally/core/hang";
import type { libraryItems, libraryMedia } from "../db/schema";
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

/** A new built-in exercise or workout: its English text, other names, and what it holds. */
export const libraryCreateBody = z.object({
  name: title,
  description,
  names: libraryEditBody.shape.names,
  spec: z.union([exerciseSpec, workoutSpec]),
});

export type LibraryCreate = z.infer<typeof libraryCreateBody>;

export type CreatedSpec = BuiltInExerciseSpec | BuiltInWorkoutSpec;

/**
 * The spec a new built-in of `type` holds, or why it cannot: an exercise's measure fits its kind;
 * a workout has items, grips when it is hangboard and built-in exercises or steps otherwise.
 */
export function createdSpec(
  type: "exercise" | "workout",
  spec: unknown,
  exerciseIds: ReadonlySet<string>
): { spec: CreatedSpec } | { error: string } {
  if (type === "exercise") {
    const parsed = exerciseSpec.safeParse(spec);
    if (!parsed.success) return { error: "invalid exercise spec" };
    if (!measuresFor(parsed.data.kind).includes(parsed.data.measure))
      return { error: `${parsed.data.measure} does not fit ${parsed.data.kind}` };
    return { spec: parsed.data };
  }
  const parsed = workoutSpec.safeParse(spec);
  if (!parsed.success) return { error: "invalid workout spec" };
  const { kind, items } = parsed.data;
  if (items.length === 0) return { error: "a workout needs an item" };
  for (const item of items) {
    if ((kind === "hangboard") !== "grip" in item)
      return {
        error: kind === "hangboard" ? "hangboard items are grips" : "grips are hangboard only",
      };
    if ("exercise" in item && !exerciseIds.has(item.exercise))
      return { error: `no built-in exercise ${item.exercise}` };
    if (item.doses.length === 0) return { error: "an item needs a dose" };
  }
  return { spec: parsed.data };
}

/** A picture's text and place, which a change records and Restore writes back. */
export type MediaState = { id: string; alt: string; credit: string };

/**
 * What a change records and Restore writes back: the text, and the pictures in order when the
 * change touched them.
 */
export type LibraryState = Pick<
  LibraryEntry,
  "name" | "description" | "translations" | "status"
> & {
  media?: MediaState[];
};

type Row = typeof libraryItems.$inferSelect;

export type MediaRow = typeof libraryMedia.$inferSelect;

export const mediaStateOf = (rows: readonly MediaRow[]): MediaState[] =>
  rows.map(({ id, alt, credit }) => ({ id, alt, credit }));

/** A picture as the apps get it, its files on the media host. */
export const pictureOf = (row: MediaRow, mediaUrl: string): LibraryPicture => ({
  kind: "picture",
  url: `${mediaUrl}/${row.key}`,
  thumbUrl: `${mediaUrl}/${row.thumb_key}`,
  width: row.width,
  height: row.height,
  alt: row.alt,
  credit: row.credit,
});

/** Whether a picture shows in the apps: it has alt text. */
export const published = (row: MediaRow): boolean => row.alt !== "";

export function entryOf(row: Row, media: LibraryPicture[] = []): LibraryEntry {
  const base = {
    id: row.id,
    status: row.status,
    name: row.name,
    description: row.description ?? "",
    translations: translations.parse(JSON.parse(row.translations)),
    media,
    updatedAt: row.updated_at,
  };
  const spec: unknown = JSON.parse(row.spec);
  if (row.type === "exercise") return { ...base, type: "exercise", spec: exerciseSpec.parse(spec) };
  if (row.type === "workout") return { ...base, type: "workout", spec: workoutSpec.parse(spec) };
  return { ...base, type: "grip" };
}

/** The library from its rows, each kind in its order, with its published pictures. */
export function libraryOf(
  rows: readonly Row[],
  media: readonly MediaRow[],
  mediaUrl: string
): BuiltInLibrary {
  const pictures = new Map<string, LibraryPicture[]>();
  for (const m of [...media].filter(published).sort((a, b) => a.position - b.position)) {
    const key = `${m.item_type}:${m.item_id}`;
    pictures.set(key, [...(pictures.get(key) ?? []), pictureOf(m, mediaUrl)]);
  }
  const library: BuiltInLibrary = { exercises: [], grips: [], workouts: [] };
  for (const row of [...rows].sort((a, b) => a.position - b.position)) {
    const entry = entryOf(row, pictures.get(`${row.type}:${row.id}`));
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
export function editedState(before: Omit<LibraryState, "media">, edit: LibraryEdit): LibraryState {
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

export const mediaState = z.object({ id: z.string(), alt: z.string(), credit: z.string() });

export const libraryState = z.object({
  name: z.string(),
  description: z.string(),
  translations,
  status: z.enum(["active", "retired"]),
  media: z.array(mediaState).optional(),
});

/** A moderator's edit to one picture: its text, or its place among the item's pictures. */
export const mediaEditBody = z.object({
  alt: z.string().trim().max(300).optional(),
  credit: z.string().trim().max(120).optional(),
  position: z.number().int().min(0).optional(),
});

/** The pictures after one moves to `position`, or after its text changes. */
export function editedMedia(
  list: readonly MediaState[],
  id: string,
  edit: z.infer<typeof mediaEditBody>
): MediaState[] {
  const from = list.findIndex((m) => m.id === id);
  const moved = {
    ...list[from]!,
    ...(edit.alt === undefined ? {} : { alt: edit.alt }),
    ...(edit.credit === undefined ? {} : { credit: edit.credit }),
  };
  const rest = list.filter((m) => m.id !== id);
  const to = Math.min(edit.position ?? from, rest.length);
  return [...rest.slice(0, to), moved, ...rest.slice(to)];
}

/** The pictures a Restore leaves: those still there, in the restored order, with its text. */
export function restoredMedia(
  current: readonly MediaState[],
  restored: readonly MediaState[]
): MediaState[] {
  const then = new Map(restored.map((m, i) => [m.id, { m, i }]));
  const rank = (m: MediaState): number => then.get(m.id)?.i ?? restored.length;
  return [...current].sort((a, b) => rank(a) - rank(b)).map((m) => then.get(m.id)?.m ?? m);
}
