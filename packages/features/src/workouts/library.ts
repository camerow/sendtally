import type { ActivityKind, Exercise, WorkoutRecord } from "@sendtally/api-client";
import {
  clock,
  defaultExerciseRestS,
  doseProtocol,
  gapRestSeconds,
  hangboardSeconds,
  isBuiltInGrip,
  itemsSeconds,
  sessionItems,
  timeUnitsOf,
  type CalendarDate,
  type Dose,
  type Focus,
  type Membership,
  type WeightUnit,
  type Workout,
  type WorkoutKind,
  FOCI,
} from "@sendtally/core/hang";
import { climbingDoseLine } from "../activities/climbing";
import { tallyMeasuresOf } from "../exercises/measure";
import type { TallyMeasure } from "../exercises/types";
import { weightValue } from "../activities/done";
import { ACTIVITY_KINDS, kindLabel } from "../activities/format";
import { countText, humanDuration, protocolParts, protocolSummary } from "../hang/format";
import { builtInGripName } from "../hang/names";
import { formatNumber, t, type MessageKey } from "../i18n";
import { durationLabel } from "../sessions/years";
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
    focus: null,
  };
}

const roundMinutes = (seconds: number): number => Math.max(1, Math.round(seconds / 60));

/**
 * A workout's planned length, the one every screen shows: for hangboard always timed from
 * the session's doses as the timer runs them, otherwise the minutes set, or for timed work
 * without them the time its items take. Doses that take turns make session `n` its own length.
 */
export function workoutMinutes(
  w: Pick<Workout, "kind" | "minutes" | "items" | "exerciseRestS">,
  session = 0
): number | null {
  const items = sessionItems(w.items, session);
  if (w.kind === "hangboard")
    return items.length > 0 ? roundMinutes(hangboardSeconds(items, w.exerciseRestS)) : null;
  if (w.minutes !== null) return w.minutes;
  const timed = items.some((i) => i.dose.onS !== undefined);
  return timed ? roundMinutes(itemsSeconds(items)) : null;
}

/** A guess at one rep: a climb takes minutes, a lift or a move a few seconds. */
const repSeconds = (kind: WorkoutKind): number => (kind === "climbing" ? 180 : 4);

/**
 * How long a workout with no minutes set should take, read from its sets, reps and rests, for
 * the editor to offer before the user types one. Timed doses count as the timer runs them.
 */
export function estimatedMinutes(
  w: Pick<Workout, "kind" | "items" | "exerciseRestS">,
  session = 0
): number | null {
  const items = sessionItems(w.items, session);
  if (items.length === 0) return null;
  const seconds = items.reduce(
    (sum, i) =>
      sum +
      (i.dose.onS !== undefined
        ? itemsSeconds([i])
        : i.dose.sets * (i.dose.reps ?? 1) * repSeconds(w.kind) +
          Math.max(0, i.dose.sets - 1) * (i.dose.setRestS ?? 0)),
    0
  );
  return roundMinutes(seconds + gapRestSeconds(items, w.exerciseRestS));
}

/** An item's exercise as the user reads it: a built-in grip in their language. */
export function exerciseName(exercise: string, gripName?: (id: string) => string): string {
  if (gripName !== undefined) return gripName(exercise);
  return isBuiltInGrip(exercise) ? builtInGripName(exercise) : exercise;
}

/**
 * What one dose prescribes. Hangboard: "6 × 7s on / 3s off · 6 sets · 3:00 rest", with
 * its edge and weight when the dose sets them. Anything else: "5 × 5 · 100 kg", "3 × 45s",
 * and for an exercise done on each side "2 × 60s a side".
 */
export function doseSummary(
  kind: WorkoutKind,
  dose: Dose,
  unit: WeightUnit,
  eachSide = false
): string {
  const weight =
    dose.weightKg === undefined
      ? null
      : t("hang.loadPlain", { value: weightValue(dose.weightKg, unit), unit });
  const edge = dose.edgeMm ? t("hang.edgeMm", { n: dose.edgeMm }) : null;
  if (kind === "hangboard") {
    const p = doseProtocol("", dose);
    return separated([...protocolParts(p, timeUnitsOf(p)), edge, weight]);
  }
  const work = [
    dose.reps === undefined ? null : countText(dose.reps, dose.repsMax),
    dose.onS === undefined ? null : humanDuration(dose.onS),
  ].filter((x) => x !== null);
  const done = work.join(" · ");
  const main =
    work.length === 0
      ? t("activities.setCount", { count: dose.sets })
      : `${countText(dose.sets, dose.setsMax)} × ${eachSide ? t("workouts.aSide", { value: done }) : done}`;
  return [main, weight, edge].filter((x) => x !== null).join(" · ");
}

/** Parts joined by " · ", a line breaking only after a separator so a value keeps its unit. */
const separated = (parts: readonly (string | null)[]): string =>
  parts
    .filter((x) => x !== null)
    .map((x) => x.replaceAll(" ", "\u00A0"))
    .join("\u00A0· ");

/** "Target RPE 8/10": the same, on its own line under the exercise name. */
export const exerciseTargetLine = ({ targetRpe }: Pick<Dose, "targetRpe">): string | undefined =>
  targetRpe === undefined ? undefined : t("common.targetRpe", { n: formatNumber(targetRpe) });

/** What a target is counted in: the workout's kind, or how a climbing exercise is measured. */
export type TargetKind = WorkoutKind | TallyMeasure;

/** A session's target, every number with its word; `rpe` is its own line, or joins a member's. */
export type TargetText = { work: string; rpe: string | undefined };

const counted = (key: MessageKey, min: number, max?: number): string =>
  t(key, { count: max ?? min, n: countText(min, max) });

/**
 * What one dose asks this session: "5 sets × 5 reps · 220 lb", "6 sets × 6 hangs · 7s on, 3s
 * off", "3 sets × 4 climbs", with "Target RPE 8/10" apart. A superset `round` leaves the sets
 * to the round count: "2 reps · 260 lb". The Target RPE is left out when it is the session's own
 * `sessionRpe`, which the screen already states.
 */
export function targetText(
  dose: Dose,
  kind: TargetKind,
  unit: WeightUnit,
  {
    eachSide = false,
    round = false,
    sessionRpe = null,
  }: { eachSide?: boolean; round?: boolean; sessionRpe?: number | null } = {}
): TargetText {
  const load =
    dose.weightKg === undefined
      ? null
      : t("hang.loadPlain", { value: weightValue(dose.weightKg, unit), unit });
  const time = (s: number): string => (s < 60 ? t("hang.seconds", { n: s }) : clock(s, true));
  const per = ((): string | null => {
    if (kind === "laps")
      return dose.onS !== undefined
        ? clock(dose.onS, true)
        : dose.reps === undefined
          ? null
          : counted("workouts.targetMoves", dose.reps);
    if (kind === "wallTime")
      return dose.onS === undefined
        ? null
        : t("activities.onTheWall", { time: clock(dose.onS, true) });
    if (kind === "climbs" || kind === "climbing")
      return dose.reps === undefined ? null : counted("workouts.targetClimbs", dose.reps);
    if (kind === "hangboard") {
      const hangs = counted("workouts.targetHangs", dose.reps ?? 1);
      const on = dose.onS === undefined ? null : time(dose.onS);
      return on === null
        ? hangs
        : `${hangs} · ${
            dose.offS === undefined || (dose.reps ?? 1) <= 1
              ? on
              : t("workouts.targetOnOff", { on, off: time(dose.offS) })
          }`;
    }
    const work = [
      dose.reps === undefined ? null : counted("workouts.targetReps", dose.reps, dose.repsMax),
      dose.onS === undefined ? null : clock(dose.onS, true),
    ]
      .filter((x) => x !== null)
      .join(" · ");
    return work === "" ? null : eachSide ? t("workouts.aSide", { value: work }) : work;
  })();
  const sets = counted(
    kind === "laps" ? "workouts.targetLaps" : "workouts.targetSets",
    dose.sets,
    dose.setsMax
  );
  const main = round ? per : per === null ? sets : `${sets} × ${per}`;
  return {
    work: [main, load].filter((x) => x !== null).join(" · "),
    rpe: dose.targetRpe === sessionRpe ? undefined : exerciseTargetLine(dose),
  };
}

/** The exercises a workout's climbing line reads its measure from, such as laps of a circuit. */
export type MeasuredExercises = readonly Pick<Exercise, "name" | "kind" | "measure">[];

/**
 * "6 × 7s on, 3s off" for a one-item hangboard workout, "4 sets of 4 climbs" or "3 laps of 40
 * moves" for a one-item climbing one, "3 exercises", or null with none.
 */
export function bodySummary(
  w: Pick<Workout, "kind" | "items">,
  exercises: MeasuredExercises = []
): string | null {
  const items = sessionItems(w.items, 0);
  const [only] = items;
  if (only === undefined) return null;
  if (w.kind === "hangboard" && items.length === 1) {
    const p = doseProtocol("", only.dose);
    return protocolSummary(p, timeUnitsOf(p));
  }
  if (w.kind === "climbing" && items.length === 1)
    return climbingDoseLine(
      only.dose,
      tallyMeasuresOf(exercises, w.kind, isBuiltInGrip)(only.exercise) === "laps"
        ? "laps"
        : only.dose.onS === undefined
          ? "climbs"
          : "wallTime"
    );
  return t("activities.exerciseCount", { count: items.length });
}

/**
 * A workout's line in a list: how many exercises, then the one exercise's dose, or how long
 * it takes; a hang dose is too long for a row, so hangboard always reads its length, and a
 * workout with no exercises reads only its length, or nothing.
 * "1 exercise · 3 × 8", "4 exercises · 30m".
 */
export function libraryLine(
  w: Workout,
  unit: WeightUnit,
  exercises: MeasuredExercises = []
): string | null {
  const all = sessionItems(w.items, 0);
  const items = all.filter((i) => i.checklist === undefined);
  const [only] = items;
  const minutes = workoutMinutes(w);
  const dose =
    only === undefined || items.length > 1 || w.kind === "hangboard"
      ? null
      : w.kind === "climbing"
        ? bodySummary(w, exercises)
        : doseSummary(w.kind, only.dose, unit);
  const tail = dose ?? (minutes === null ? null : durationLabel(minutes));
  if (only === undefined)
    return all.length === 0
      ? tail
      : [t("workouts.checklist"), tail].filter((p) => p !== null).join(" · ");
  const count = t("activities.exerciseCount", { count: items.length });
  return tail === null ? count : `${count} · ${tail}`;
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

/** Its own focus; none from app builds before focus. */
const focusOf = (w: LibraryWorkout): Focus | null => w.focus ?? null;

function matches(w: LibraryWorkout, text: string): boolean {
  const words = fold(text).split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const exercises = w.items.map((i) => exerciseName(i.exercise));
  const haystack = fold([w.name, w.description, kindLabel(w.kind), ...exercises].join(" "));
  return words.every((word) => haystack.includes(word));
}

const UNUSED: WorkoutUse = { count: 0, last: null };

/** What a search lets through: some kinds only, or one focus only, where null is General. */
export type LibrarySearch = {
  text: string;
  kinds?: readonly WorkoutKind[];
  focus?: Focus | null;
};

/**
 * The workouts a search lets through, in one list: the user's own first, last used
 * first then by name, then the built-ins in their curated order.
 */
export function browseLibrary(
  library: readonly LibraryWorkout[],
  search: LibrarySearch,
  usage: ReadonlyMap<string, WorkoutUse>
): LibraryWorkout[] {
  const found = library.filter(
    (w) =>
      (search.kinds === undefined || search.kinds.includes(w.kind)) &&
      (search.focus === undefined || focusOf(w) === search.focus) &&
      matches(w, search.text)
  );
  const last = (w: LibraryWorkout): string => (usage.get(w.id) ?? UNUSED).last ?? "";
  return [
    ...found
      .filter((w) => w.source === "mine")
      .sort((a, b) => last(b).localeCompare(last(a)) || a.name.localeCompare(b.name)),
    ...found.filter((w) => w.source === "library"),
  ];
}

/**
 * One shelf per focus in the order a season runs and General last, each as `browseLibrary`
 * orders it. A focus with no workout matching `text` is left out unless `empty` keeps it.
 */
export function libraryShelves(
  library: readonly LibraryWorkout[],
  usage: ReadonlyMap<string, WorkoutUse>,
  { text = "", empty = false }: { text?: string; empty?: boolean } = {}
): LibraryShelf[] {
  return [...FOCI, null]
    .map((focus) => ({ focus, workouts: browseLibrary(library, { text, focus }, usage) }))
    .filter((s) => empty || s.workouts.length > 0);
}
