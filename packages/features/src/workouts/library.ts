import type {
  ActivityKind,
  ClimbFocus,
  PlanItem,
  PlanTemplate,
  UserWorkout,
  Workout,
} from "@sendtally/api-client";
import { intervalSeconds, totalSeconds, type CalendarDate } from "@sendtally/core/hang";
import { ACTIVITY_KINDS, kindLabel } from "../activities/format";
import { intervalsSummary } from "../activities/intervals";
import { protocolSummary } from "../hang/format";
import { workoutBlurb } from "../hang/names";
import { t, type MessageKey } from "../i18n";
import { builtInWorkouts } from "./builtIns";
import type {
  LibraryFilter,
  LibraryWorkout,
  WorkoutCategory,
  WorkoutDraft,
  WorkoutUse,
} from "./types";

export const WORKOUT_CATEGORIES = [
  "hang",
  "climb",
  "strength",
  "mobility",
  "run",
  "yoga",
  "other",
] as const satisfies readonly WorkoutCategory[];

export const CLIMB_FOCUSES = [
  "limit",
  "volume",
  "project",
  "endurance",
] as const satisfies readonly ClimbFocus[];

const FOCUS_LABELS: Record<ClimbFocus, MessageKey> = {
  limit: "workouts.focusLimit",
  volume: "workouts.focusVolume",
  project: "workouts.focusProject",
  endurance: "workouts.focusEndurance",
};

export function categoryLabel(category: WorkoutCategory): string {
  return category === "hang" ? t("training.hangboard") : kindLabel(category);
}

export function focusLabel(focus: ClimbFocus): string {
  return t(FOCUS_LABELS[focus]);
}

/** The activity kind a workout logs as, or null for hangboard and climbing ones. */
export function activityKindOf(category: WorkoutCategory): ActivityKind | null {
  return ACTIVITY_KINDS.find((k) => k === category) ?? null;
}

/** "Repeaters 7:3 (copy)": what customising or duplicating a workout names the copy. */
export function copyName(name: string): string {
  return t("hang.copyName", { name });
}

function fromHang(w: Workout): LibraryWorkout {
  return {
    id: w.id,
    source: w.source,
    category: "hang",
    name: w.name,
    description: w.source === "library" ? workoutBlurb(w) : null,
    tags: [],
    minutes: Math.max(1, Math.round(totalSeconds(w) / 60)),
    targetRpe: null,
    body: { kind: "hang", workout: w },
  };
}

function fromUser(w: UserWorkout): LibraryWorkout {
  return {
    id: w.id,
    source: "mine",
    category: w.category,
    name: w.name,
    description: w.description,
    tags: w.tags,
    minutes: w.minutes,
    targetRpe: w.targetRpe,
    body: w.body,
  };
}

/**
 * Every workout the user can run, in one list: hangboard workouts (the built-in
 * library and their own, as the hangboard model names them), the other built-ins,
 * and their own workouts of every other category.
 */
export function libraryOf(
  hangWorkouts: readonly Workout[],
  userWorkouts: readonly UserWorkout[]
): LibraryWorkout[] {
  return [...hangWorkouts.map(fromHang), ...builtInWorkouts(), ...userWorkouts.map(fromUser)];
}

/** The workout as the editor saves it, or null for a hangboard one, which has its own builder. */
export function draftOf(w: LibraryWorkout): WorkoutDraft | null {
  const { name, category, description, tags, minutes, targetRpe, body } = w;
  if (category === "hang" || body?.kind === "hang") return null;
  return { name, category, description, tags, minutes, targetRpe, body };
}

/** What a plan item or an activity of this workout starts from: its sets, checklist or intervals. */
export function templateOfWorkout(w: LibraryWorkout | undefined): PlanTemplate | null {
  const body = w?.body;
  return body === undefined || body === null || body.kind === "hang" || body.kind === "climb"
    ? null
    : body;
}

/** A plan item's body: its workout's while that exists, else its own template. */
export function planTemplateOf(
  item: Pick<PlanItem, "template" | "workoutId">,
  library: readonly LibraryWorkout[]
): PlanTemplate | null {
  const workout =
    item.workoutId === null || item.workoutId === undefined
      ? undefined
      : library.find((w) => w.id === item.workoutId);
  return workout === undefined ? item.template : templateOfWorkout(workout);
}

/** Minutes, or for intervals without them the time the run takes. */
export function workoutMinutes(w: LibraryWorkout): number | null {
  if (w.minutes !== null) return w.minutes;
  return w.body?.kind === "intervals"
    ? Math.max(1, Math.round(intervalSeconds(w.body) / 60))
    : null;
}

/** "6 × 7s on, 3s off", "5 exercises", "6 items", "5 rounds · 2 steps · 25 min" or "Limit". */
export function bodySummary(w: LibraryWorkout): string | null {
  const body = w.body;
  if (body === null) return null;
  switch (body.kind) {
    case "hang":
      return protocolSummary(body.workout, body.workout.timeUnits);
    case "sets":
      return t("activities.exerciseCount", { count: body.exercises.length });
    case "checklist":
      return t("workouts.itemCount", { count: body.items.length });
    case "intervals":
      return intervalsSummary(body);
    case "climb":
      return focusLabel(body.focus);
  }
}

function bodyWords(w: LibraryWorkout): string[] {
  const body = w.body;
  if (body === null) return [];
  switch (body.kind) {
    case "hang":
      return [];
    case "sets":
      return body.exercises.map((e) => e.name);
    case "checklist":
      return body.items.map((i) => i.text);
    case "intervals":
      return body.steps.map((s) => s.label);
    case "climb":
      return [focusLabel(body.focus)];
  }
}

type Used = { workoutId?: string | null; date: CalendarDate };

type Logged = Used & { planItemId?: string | null };

/**
 * How often and how lately each workout ran: hangboard sessions by their workout,
 * activities by theirs, or else by the workout of the plan item they fulfilled.
 */
export function workoutUsage(
  hangSessions: readonly Used[],
  activities: readonly Logged[],
  planItems: readonly Pick<PlanItem, "id" | "workoutId">[]
): Map<string, WorkoutUse> {
  const planned = new Map(planItems.map((p) => [p.id, p.workoutId ?? null]));
  const usage = new Map<string, WorkoutUse>();
  const add = (id: string | null | undefined, date: CalendarDate): void => {
    if (id === null || id === undefined) return;
    const use = usage.get(id) ?? { count: 0, last: null };
    usage.set(id, {
      count: use.count + 1,
      last: use.last === null || date > use.last ? date : use.last,
    });
  };
  for (const s of hangSessions) add(s.workoutId, s.date);
  for (const a of activities) {
    const viaPlan =
      a.planItemId === null || a.planItemId === undefined ? null : planned.get(a.planItemId);
    add(a.workoutId ?? viaPlan, a.date);
  }
  return usage;
}

const fold = (text: string): string => text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function matches(w: LibraryWorkout, text: string): boolean {
  const words = fold(text).split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const haystack = fold(
    [w.name, w.description ?? "", categoryLabel(w.category), ...w.tags, ...bodyWords(w)].join(" ")
  );
  return words.every((word) => haystack.includes(word));
}

const UNUSED: WorkoutUse = { count: 0, last: null };

/** The workouts the filter lets through, in its order; ties fall back to name. */
export function browseLibrary(
  library: readonly LibraryWorkout[],
  filter: LibraryFilter,
  usage: ReadonlyMap<string, WorkoutUse>
): LibraryWorkout[] {
  const usageOf = (w: LibraryWorkout): WorkoutUse => usage.get(w.id) ?? UNUSED;
  const byName = (a: LibraryWorkout, b: LibraryWorkout): number => a.name.localeCompare(b.name);
  const duration = (w: LibraryWorkout): number => workoutMinutes(w) ?? Number.MAX_SAFE_INTEGER;
  const order: Record<LibraryFilter["sort"], (a: LibraryWorkout, b: LibraryWorkout) => number> = {
    recent: (a, b) => (usageOf(b).last ?? "").localeCompare(usageOf(a).last ?? ""),
    most: (a, b) => usageOf(b).count - usageOf(a).count,
    name: () => 0,
    duration: (a, b) => duration(a) - duration(b),
  };
  return library
    .filter(
      (w) =>
        (filter.source === "all" || w.source === filter.source) &&
        (filter.categories.length === 0 || filter.categories.includes(w.category)) &&
        matches(w, filter.text)
    )
    .sort((a, b) => order[filter.sort](a, b) || byName(a, b));
}

export const DEFAULT_FILTER: LibraryFilter = {
  text: "",
  categories: [],
  source: "all",
  sort: "recent",
};

/** Whether the filter narrows the library at all, sort aside. */
export const isFiltered = (f: LibraryFilter): boolean =>
  f.text.trim() !== "" || f.categories.length > 0 || f.source !== "all";

/** A new workout of the category, with the body its editor starts from. */
export function newWorkoutDraft(category: Exclude<WorkoutCategory, "hang">): WorkoutDraft {
  return {
    name: "",
    category,
    description: null,
    tags: [],
    minutes: null,
    targetRpe: null,
    body: category === "climb" ? { kind: "climb", focus: "limit", projectId: null } : null,
  };
}

/** Comma-separated text as tags: trimmed, each once, at most ten. */
export function parseTags(text: string): string[] {
  const tags = text
    .split(",")
    .map((tag) => tag.trim().slice(0, 30))
    .filter((tag) => tag !== "");
  return [...new Set(tags)].slice(0, 10);
}
