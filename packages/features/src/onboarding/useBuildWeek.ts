import type { SendtallyApi } from "@sendtally/api-client";
import type { CalendarDate, Weekday, WorkoutKind } from "@sendtally/core/hang";
import { newBlock } from "../training/blockMeta";
import { usePlan } from "../training/usePlan";
import type { PlanActions } from "../training/usePlanActions";
import type { LibraryWorkout } from "../workouts/types";
import type { WorkoutLibraryQuery } from "../workouts/useWorkoutLibrary";
import { defaultBlockName, nameOr } from "./defaultNames";
import { nextMonday, sessionsPerWeek } from "./planMaths";
import {
  placedWorkouts,
  setPlanPath,
  STARTERS,
  usePlanPath,
  withDay,
  withKnown,
  pickToggled,
  type PlanPath,
} from "./planPath";
import type { Wizard } from "./types";
import { useSeededPlanPath } from "./useSeededPlanPath";
import { useOnePress } from "./useOnePress";

const WEEKDAYS: readonly Weekday[] = [0, 1, 2, 3, 4, 5, 6];

export type BuildWeekRow = { workout: LibraryWorkout; picked: boolean; days: readonly Weekday[] };

/** The list: picks that are not starters, the user's own first, then the six starters; one the library lacks is left out. */
export function buildWeekRows(
  p: PlanPath,
  workout: (id: string) => LibraryWorkout | undefined
): BuildWeekRow[] {
  return [...p.workouts.filter((id) => !STARTERS.includes(id)), ...STARTERS].flatMap((id) => {
    const w = workout(id);
    return w === undefined
      ? []
      : [{ workout: w, picked: p.workouts.includes(id), days: p.days[id] ?? [] }];
  });
}

export function useMemberWeek(
  api: SendtallyApi,
  library: WorkoutLibraryQuery["state"]
): { week: (WorkoutKind[] | null)[]; sessions: number } {
  const path = usePlanPath();
  const plan = usePlan(api).state;
  const members =
    plan.status === "ready" && library.status === "ready"
      ? plan.data.memberships
          .filter((m) => m.blockId !== null && m.blockId === path.blockId)
          .sort((a, b) => a.position - b.position)
      : [];
  const placed = members.flatMap((m) => {
    const workout = library.status === "ready" ? library.data.workout(m.workoutId) : undefined;
    return workout === undefined ? [] : [{ days: m.weekdays, kind: workout.kind }];
  });
  return {
    week: WEEKDAYS.map((d) => {
      const kinds = placed.filter((p) => p.days.includes(d)).map((p) => p.kind);
      return kinds.length > 0 ? kinds : null;
    }),
    sessions: sessionsPerWeek(Object.fromEntries(members.map((m) => [m.id, m.weekdays]))),
  };
}

/** The week card: each day with the kinds placed on it, or null when nothing is. */
export function weekOf(
  p: PlanPath,
  kindOf: (id: string) => WorkoutKind | undefined
): (WorkoutKind[] | null)[] {
  const placed = placedWorkouts(p);
  return WEEKDAYS.map((d) => {
    const on = placed.filter((id) => p.days[id]?.includes(d) === true);
    return on.length === 0 ? null : on.flatMap((id) => kindOf(id) ?? []);
  });
}

/** What leaving the step reports: workouts placed, sessions a week, and whether one is the user's own. */
export function buildWeekCompleted(
  p: PlanPath,
  mine: (id: string) => boolean
): { count: number; sessions: number; own: 0 | 1 } {
  const placed = placedWorkouts(p);
  return {
    count: placed.length,
    sessions: sessionsPerWeek(p.days),
    own: placed.some(mine) ? 1 : 0,
  };
}

export type BuildWeekState =
  | { status: "loading"; start: CalendarDate }
  | {
      status: "ready";
      start: CalendarDate;
      rows: BuildWeekRow[];
      week: (WorkoutKind[] | null)[];
      sessions: number;
      toggle: (id: string) => void;
      toggleDay: (id: string, day: Weekday) => void;
      /** Saves the block with its placed workouts, scheduled from next Monday, and moves on. */
      schedule: () => void;
    };

/** Build your week: pick workouts and put them on days; leaving saves and schedules the block. */
export function useBuildWeek({
  wizard,
  api,
  today,
  library,
  actions,
  newId,
}: {
  wizard: Wizard;
  api: SendtallyApi;
  today: CalendarDate;
  library: WorkoutLibraryQuery["state"];
  actions: PlanActions;
  newId: () => string;
}): BuildWeekState {
  const walk = useSeededPlanPath(api);
  const plan = usePlan(api).state;
  const once = useOnePress();
  const start = nextMonday(today);
  if (!walk.seeded || plan.status !== "ready" || library.status !== "ready")
    return { status: "loading", start };
  const workout = library.data.workout;
  const path = withKnown(walk, (id) => workout(id) !== undefined);

  const schedule = (): void => {
    const placed = placedWorkouts(path);
    if (placed.length === 0) return;
    const blockId = path.blockId ?? newId();
    const saved = plan.data.blocks.find((b) => b.id === blockId);
    void actions.saveBlock({
      ...(saved ?? newBlock(blockId)),
      name: nameOr(saved?.name ?? null, defaultBlockName(start)),
      start,
    });
    const members = Object.fromEntries(
      placed.map((workoutId, position) => {
        const id = path.members[workoutId] ?? newId();
        void actions.saveMembership({
          id,
          workoutId,
          blockId,
          weekdays: [...(path.days[workoutId] ?? [])],
          start,
          position,
        });
        return [workoutId, id];
      })
    );
    Object.entries(path.members)
      .filter(([workoutId]) => !(workoutId in members))
      .forEach(([, id]) => void actions.deleteMembership(id));
    setPlanPath((p) => ({ ...p, blockId, members }));
    wizard.next(buildWeekCompleted(path, (id) => workout(id)?.source === "mine"));
  };

  return {
    status: "ready",
    start,
    rows: buildWeekRows(path, workout),
    week: weekOf(path, (id) => workout(id)?.kind),
    sessions: sessionsPerWeek(path.days),
    toggle: (id) => setPlanPath((p) => pickToggled(p, id)),
    toggleDay: (id, day) => setPlanPath((p) => withDay(p, id, day)),
    schedule: once(schedule),
  };
}
