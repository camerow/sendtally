import type { ExerciseKind, ExerciseMeasure } from "./exercise";
import type { BuiltInGrip } from "./library";
import type { Dose, Focus, WorkoutKind } from "./plan";

/** The kinds of item in the built-in library. */
export const LIBRARY_TYPES = ["exercise", "grip", "workout"] as const;

export type LibraryType = (typeof LIBRARY_TYPES)[number];

/** The languages a built-in's English text is translated into. */
export const TRANSLATED_LOCALES = ["de", "fr", "es"] as const;

export type TranslatedLocale = (typeof TRANSLATED_LOCALES)[number];

/** A built-in's text in one language; what is missing falls back to English. */
export type LibraryText = { name?: string; description?: string };

export type LibraryTranslations = Partial<Record<TranslatedLocale, LibraryText>>;

/** What a built-in exercise is measured in, and what a workout item of it starts at when its measure's start does not fit. */
export type BuiltInExerciseSpec = { kind: ExerciseKind; measure: ExerciseMeasure; dose?: Dose };

/** Interval steps a built-in workout names that are not exercises of their own. */
export type BuiltInStep = "hard" | "easy";

/** A hangboard item names its grip; every other item a built-in exercise or an interval step. */
export type BuiltInItemSpec =
  | { grip: BuiltInGrip; doses: readonly Dose[] }
  | { exercise: string; doses: readonly Dose[] }
  | { step: BuiltInStep; doses: readonly Dose[] };

/** What a built-in workout holds. Edge depth and added weight are chosen per use, so hangboard items carry neither. */
export type BuiltInWorkoutSpec = {
  kind: WorkoutKind;
  focus: Focus | null;
  minutes: number | null;
  targetRpe: number | null;
  items: readonly BuiltInItemSpec[];
};

/** A picture on a built-in, at 1600 px on its long side and as a 144 px square thumbnail. */
export type LibraryPicture = {
  kind: "picture";
  url: string;
  thumbUrl: string;
  width: number;
  height: number;
  alt: string;
  credit: string;
};

/**
 * One item of the built-in library, in English with its translations. Its id is never changed
 * or reused, since logs, plans and the user's own exercises name it; a retired one only leaves
 * pickers and lists.
 */
type Entry<T extends LibraryType> = {
  type: T;
  id: string;
  status: "active" | "retired";
  name: string;
  description: string;
  translations: LibraryTranslations;
  /** Its pictures in order; only those with alt text reach the apps. */
  media: LibraryPicture[];
  updatedAt: string | null;
};

export type BuiltInExerciseEntry = Entry<"exercise"> & { spec: BuiltInExerciseSpec };
export type BuiltInGripEntry = Entry<"grip">;
export type BuiltInWorkoutEntry = Entry<"workout"> & { spec: BuiltInWorkoutSpec };
export type LibraryEntry = BuiltInExerciseEntry | BuiltInGripEntry | BuiltInWorkoutEntry;

/** The built-in library, each kind in the order it is offered. */
export type BuiltInLibrary = {
  exercises: BuiltInExerciseEntry[];
  grips: BuiltInGripEntry[];
  workouts: BuiltInWorkoutEntry[];
};

/** An entry's name and description in a language, each falling back to English. */
export function entryText(entry: LibraryEntry, locale: string): Required<LibraryText> {
  const own = entry.translations[locale as TranslatedLocale];
  return {
    name: own?.name || entry.name,
    description: own?.description || entry.description,
  };
}

/** Every name an entry goes by, English first. */
export const entryNames = (entry: LibraryEntry): string[] => [
  entry.name,
  ...TRANSLATED_LOCALES.flatMap((l) => entry.translations[l]?.name || []),
];

const ID_PREFIX: Record<WorkoutKind, string> = {
  climbing: "climb",
  hangboard: "fingers",
  strength: "strength",
  mobility: "mobility",
  other: "other",
};

/**
 * The id a new built-in takes from its English name: camelCase for an exercise ("pullUps"), and
 * kebab-case under its kind for a workout ("strength-pull-day"). Empty when the name has no
 * letters or digits.
 */
export function libraryIdOf(type: "exercise" | "workout", name: string, kind: WorkoutKind): string {
  const words =
    name
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .match(/[a-z0-9]+/g) ?? [];
  if (words.length === 0) return "";
  const id =
    type === "exercise"
      ? words.map((w, i) => (i === 0 ? w : `${w[0]!.toUpperCase()}${w.slice(1)}`)).join("")
      : [ID_PREFIX[kind], ...words].join("-");
  return id.slice(0, 64);
}
