import type { ActivityKind, WorkoutRecord } from "@sendtally/api-client";
import {
  defaultExerciseRestS,
  doseProtocol,
  hangboardSeconds,
  isBuiltInGrip,
  itemsSeconds,
  letterOf,
  sessionItems,
  timeUnitsOf,
  toUnit,
  turnsOf,
  type CalendarDate,
  type Dose,
  type Item,
  type Membership,
  type WeightUnit,
  type Workout,
  type WorkoutKind,
  WORKOUT_KINDS,
} from "@sendtally/core/hang";
import { ACTIVITY_KINDS, kindLabel } from "../activities/format";
import { humanDuration, protocolSummary } from "../hang/format";
import { builtInGripName } from "../hang/names";
import { formatNumber, t } from "../i18n";
import { builtInWorkouts } from "./builtIns";
import type { LibraryShelf, LibraryWorkout, WorkoutDraft, WorkoutUse } from "./types";

/** The activity kind a workout logs as, or null for hangboard and climbing ones. */
export function activityKindOf(kind: WorkoutKind): ActivityKind | null {
  return ACTIVITY_KINDS.find((k) => k === kind) ?? null;
}

/** "Repeaters 7:3 (copy)": what customising or duplicating a workout names the copy. */
export function copyName(name: string): string {
  return t("hang.copyName", { name });
}

/** Every workout the user can run, in one list: the built-ins and their own. */
export function libraryOf(mine: readonly WorkoutRecord[]): LibraryWorkout[] {
  return [
    ...builtInWorkouts(),
    ...mine.map(({ updatedAt: _, ...w }): LibraryWorkout => ({ ...w, source: "mine" })),
  ];
}

/** The workout as the editor saves it. */
export function draftOf({ id: _, source: __, ...w }: LibraryWorkout): WorkoutDraft {
  return w;
}

/** A new workout of the kind, nothing in it yet. */
export function newWorkoutDraft(kind: WorkoutKind): WorkoutDraft {
  return {
    kind,
    name: "",
    description: "",
    minutes: null,
    targetRpe: null,
    items: [],
    exerciseRestS: defaultExerciseRestS(kind),
  };
}

const roundMinutes = (seconds: number): number => Math.max(1, Math.round(seconds / 60));

/**
 * How long its first session takes: for hangboard always counted from its items,
 * otherwise the minutes set, or for timed work without them the time its items take.
 */
export function workoutMinutes(
  w: Pick<Workout, "kind" | "minutes" | "items" | "exerciseRestS">
): number | null {
  const items = sessionItems(w.items, 0);
  if (w.kind === "hangboard")
    return items.length > 0 ? roundMinutes(hangboardSeconds(items, w.exerciseRestS)) : null;
  if (w.minutes !== null) return w.minutes;
  const timed = items.some((i) => i.dose.onS !== undefined);
  return timed ? roundMinutes(itemsSeconds(items)) : null;
}

/** An item's exercise as the user reads it: a built-in grip in their language. */
export function exerciseName(exercise: string, gripName?: (id: string) => string): string {
  if (gripName !== undefined) return gripName(exercise);
  return isBuiltInGrip(exercise) ? builtInGripName(exercise) : exercise;
}

/**
 * What one dose prescribes. Hangboard: "6 × 7s on / 3s off · 6 sets · 3:00 rest", with
 * its edge and weight when the dose sets them. Anything else: "5 × 5 · 100 kg", "3 × 45s".
 */
export function doseSummary(kind: WorkoutKind, dose: Dose, unit: WeightUnit): string {
  const weight =
    dose.weightKg === undefined
      ? null
      : t("hang.loadPlain", { value: formatNumber(toUnit(dose.weightKg, unit)), unit });
  const edge = dose.edgeMm === undefined ? null : t("hang.edgeMm", { n: dose.edgeMm });
  if (kind === "hangboard") {
    const p = doseProtocol("", dose);
    return [protocolSummary(p, timeUnitsOf(p)), edge, weight].filter((x) => x !== null).join(" · ");
  }
  const work = [
    dose.reps === undefined ? null : formatNumber(dose.reps),
    dose.onS === undefined ? null : humanDuration(dose.onS),
  ].filter((x) => x !== null);
  const main =
    work.length === 0
      ? t("activities.setCount", { count: dose.sets })
      : `${formatNumber(dose.sets)} × ${work.join(" · ")}`;
  return [main, weight, edge].filter((x) => x !== null).join(" · ");
}

/** "B Light": a dose's letter, with its name when it has one. */
export const letterName = (turn: number, name?: string): string =>
  name === undefined ? letterOf(turn) : `${letterOf(turn)} ${name}`;

/**
 * What session `n` of a workout that takes turns is called, such as Heavy: the name its
 * turn's dose has on the first item that takes as many turns as the workout and names it.
 */
export function turnName(items: readonly Pick<Item, "doses">[], n: number): string | undefined {
  const turns = turnsOf(items);
  const turn = n % turns;
  if (turns === 1) return undefined;
  return items.find((i) => i.doses.length === turns && i.doses[turn]?.name !== undefined)?.doses[
    turn
  ]?.name;
}

/** "6 × 7s on, 3s off" for a one-item hangboard workout, "3 exercises", or null with none. */
export function bodySummary(w: Pick<Workout, "kind" | "items">): string | null {
  const items = sessionItems(w.items, 0);
  const [only] = items;
  if (only === undefined) return null;
  if (w.kind === "hangboard" && items.length === 1) {
    const p = doseProtocol("", only.dose);
    return protocolSummary(p, timeUnitsOf(p));
  }
  return t("activities.exerciseCount", { count: items.length });
}

type Logged = { workoutId?: string | null; membershipId?: string | null; date: CalendarDate };

/**
 * How often and how lately each workout ran: by the workout a session names, or
 * else by the workout of the membership it ran.
 */
export function workoutUsage(
  logged: readonly Logged[],
  memberships: readonly Pick<Membership, "id" | "workoutId">[]
): Map<string, WorkoutUse> {
  const planned = new Map(memberships.map((m) => [m.id, m.workoutId]));
  const usage = new Map<string, WorkoutUse>();
  for (const s of logged) {
    const id =
      s.workoutId ??
      (s.membershipId === null || s.membershipId === undefined
        ? undefined
        : planned.get(s.membershipId));
    if (id === undefined || id === null) continue;
    const use = usage.get(id) ?? { count: 0, last: null };
    usage.set(id, {
      count: use.count + 1,
      last: use.last === null || s.date > use.last ? s.date : use.last,
    });
  }
  return usage;
}

const fold = (text: string): string => text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function matches(w: LibraryWorkout, text: string): boolean {
  const words = fold(text).split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const exercises = w.items.map((i) => exerciseName(i.exercise));
  const haystack = fold([w.name, w.description, kindLabel(w.kind), ...exercises].join(" "));
  return words.every((word) => haystack.includes(word));
}

const UNUSED: WorkoutUse = { count: 0, last: null };

/**
 * The workouts a search lets through, optionally of some kinds only, in one list: the
 * user's own first, last used first then by name, then the built-ins in their curated order.
 */
export function browseLibrary(
  library: readonly LibraryWorkout[],
  search: { text: string; kinds?: readonly WorkoutKind[] },
  usage: ReadonlyMap<string, WorkoutUse>
): LibraryWorkout[] {
  const found = library.filter(
    (w) => (search.kinds === undefined || search.kinds.includes(w.kind)) && matches(w, search.text)
  );
  const last = (w: LibraryWorkout): string => (usage.get(w.id) ?? UNUSED).last ?? "";
  return [
    ...found
      .filter((w) => w.source === "mine")
      .sort((a, b) => last(b).localeCompare(last(a)) || a.name.localeCompare(b.name)),
    ...found.filter((w) => w.source === "library"),
  ];
}

/** One shelf per category that has a workout, in category order, each as `browseLibrary` orders it. */
export function libraryShelves(
  library: readonly LibraryWorkout[],
  usage: ReadonlyMap<string, WorkoutUse>
): LibraryShelf[] {
  return WORKOUT_KINDS.map((kind) => ({
    kind,
    workouts: browseLibrary(library, { text: "", kinds: [kind] }, usage),
  })).filter((s) => s.workouts.length > 0);
}
