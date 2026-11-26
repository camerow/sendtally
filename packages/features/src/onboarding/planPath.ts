import React from "react";
import type { Plan } from "@sendtally/api-client";
import type { Weekday } from "@sendtally/core/hang";

/** What the plan path has made so far, by id: its workouts picked in order, each one's days and membership, and the block. */
export type PlanPath = {
  workouts: readonly string[];
  days: Readonly<Record<string, readonly Weekday[]>>;
  members: Readonly<Record<string, string>>;
  blockId: string | null;
  /** Whether the saved plan has been read into it yet. */
  seeded: boolean;
};

export const EMPTY_PATH: PlanPath = {
  workouts: [],
  days: {},
  members: {},
  blockId: null,
  seeded: false,
};

export const CLIMBING = "climb-session";

/** The built-in workouts Build your week lists, in order: Climbing, Max hangs, 5x5 strength, Antagonist push, Core circuit, Hip mobility flow. */
export const STARTERS: readonly string[] = [
  CLIMBING,
  "max10",
  "strength-5x5",
  "strength-antagonist",
  "other-core",
  "mobility-hips",
];

// ponytail: one walk per app run, held in memory and lost on a kill by design (spec section 2);
// `seededPath` rebuilds it from the saved plan.
let path = EMPTY_PATH;
const listeners = new Set<() => void>();

const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export function setPlanPath(change: (p: PlanPath) => PlanPath): void {
  path = change(path);
  listeners.forEach((l) => l());
}

/** A new account starts its own walk. */
export const resetPlanPath = (): void => setPlanPath(() => EMPTY_PATH);

export function usePlanPath(): PlanPath {
  return React.useSyncExternalStore(subscribe, () => path);
}

/**
 * The walk as the saved data has it when memory holds none, after a kill: the newest dated
 * block with workouts in it, which is what Build your week saves, else a new walk with
 * Climbing picked. A template has no date and is never the walk.
 */
export function seededPath(p: PlanPath, plan: Pick<Plan, "blocks" | "memberships">): PlanPath {
  if (p.seeded) return p;
  if (p.workouts.length > 0 || p.blockId !== null) return { ...p, seeded: true };
  const block = plan.blocks
    .filter((b) => b.start !== null)
    .map((b) => ({ b, members: plan.memberships.filter((m) => m.blockId === b.id) }))
    .filter(({ members }) => members.length > 0)
    .at(-1);
  if (block === undefined) return { ...p, workouts: [CLIMBING], seeded: true };
  const members = [...block.members].sort((a, b) => a.position - b.position);
  return {
    workouts: members.map((m) => m.workoutId),
    days: Object.fromEntries(members.map((m) => [m.workoutId, m.weekdays])),
    members: Object.fromEntries(members.map((m) => [m.workoutId, m.id])),
    blockId: block.b.id,
    seeded: true,
  };
}

/** Picks a workout, last, or takes it back with its days. */
export const pickToggled = (p: PlanPath, id: string): PlanPath =>
  p.workouts.includes(id)
    ? {
        ...p,
        workouts: p.workouts.filter((w) => w !== id),
        days: Object.fromEntries(Object.entries(p.days).filter(([w]) => w !== id)),
      }
    : { ...p, workouts: [...p.workouts, id] };

/** Puts a picked workout on a day, or takes it off. */
export const withDay = (p: PlanPath, id: string, day: Weekday): PlanPath => {
  const now = p.days[id] ?? [];
  const next = now.includes(day) ? now.filter((d) => d !== day) : [...now, day];
  return { ...p, days: { ...p.days, [id]: [...next].sort((a, b) => a - b) } };
};

/** The picked workouts with a day: the block holds these, and a pick with no day is left out. */
/** The walk less any workout the library no longer has, so a deleted one is neither drawn nor scheduled. */
export const withKnown = (p: PlanPath, known: (id: string) => boolean): PlanPath =>
  p.workouts.every(known)
    ? p
    : {
        ...p,
        workouts: p.workouts.filter(known),
        days: Object.fromEntries(Object.entries(p.days).filter(([id]) => known(id))),
      };

export const placedWorkouts = (p: PlanPath): string[] =>
  p.workouts.filter((id) => (p.days[id]?.length ?? 0) > 0);
