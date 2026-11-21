import React from "react";
import type { Plan, WorkoutRecord } from "@sendtally/api-client";
import type { Weekday } from "@sendtally/core/hang";

/** What the plan path has made so far, by id: its workouts in order, each one's days and membership, and the block. */
export type PlanPath = {
  workouts: readonly string[];
  days: Readonly<Record<string, readonly Weekday[]>>;
  members: Readonly<Record<string, string>>;
  blockId: string | null;
  /** The workout P2 edits when it opens again; null makes a new one. */
  building: string | null;
};

export const EMPTY_PATH: PlanPath = {
  workouts: [],
  days: {},
  members: {},
  blockId: null,
  building: null,
};

// ponytail: one walk per app run, held in memory and lost on a kill by design (spec section 2);
// `resumedPath` rebuilds it from the saved plan.
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

export function usePlanPath(): PlanPath {
  return React.useSyncExternalStore(subscribe, () => path);
}

/**
 * The walk as the saved data has it when memory holds none, after a kill: the newest
 * unscheduled block with workouts in it, else the newest workout of the user's own.
 */
export function resumedPath(
  p: PlanPath,
  plan: Pick<Plan, "blocks" | "memberships">,
  mine: readonly Pick<WorkoutRecord, "id" | "updatedAt">[]
): PlanPath {
  if (p.workouts.length > 0) return p;
  const block = plan.blocks
    .filter((b) => b.start === null)
    .map((b) => ({ b, members: plan.memberships.filter((m) => m.blockId === b.id) }))
    .filter(({ members }) => members.length > 0)
    .at(-1);
  if (block !== undefined) {
    const members = [...block.members].sort((a, b) => a.position - b.position);
    return {
      workouts: members.map((m) => m.workoutId),
      days: Object.fromEntries(members.map((m) => [m.workoutId, m.weekdays])),
      members: Object.fromEntries(members.map((m) => [m.workoutId, m.id])),
      blockId: block.b.id,
      building: null,
    };
  }
  const newest = [...mine].sort((a, b) => a.updatedAt.localeCompare(b.updatedAt)).at(-1);
  return newest === undefined ? p : { ...p, workouts: [newest.id] };
}
