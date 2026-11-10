import React from "react";
import type { Plan } from "@sendtally/api-client";
import type { Block, WeekChange } from "@sendtally/core/hang";
import {
  applyDraft,
  draftChange,
  draftMove,
  draftRemove,
  draftSchedule,
  emptyDraft,
  scheduleOf,
  toggleDay,
  type DaySchedule,
  type DayToggle,
  type PlanDraft,
} from "@sendtally/features/training";
import { usePlanActions } from "../plan/usePlanActions";

/** Edit mode over a plan: changes held as a draft until Save, dropped on Cancel. */
export type PlanDraftState = {
  editing: boolean;
  /** The plan as the draft would leave it; the plan itself while reading. */
  plan: Plan;
  begin: () => void;
  cancel: () => void;
  save: () => void;
  setBlock: (block: Block) => void;
  toggle: (membershipId: string, change: DayToggle) => void;
  setSchedules: (schedules: readonly DaySchedule[]) => void;
  setChange: (change: WeekChange) => void;
  /** Moves a workout a place within its block. */
  move: (blockId: string, membershipId: string, by: -1 | 1) => void;
  /** Takes a workout out on Save. */
  remove: (membershipId: string) => void;
};

export function usePlanDraft(plan: Plan, startEditing = false): PlanDraftState {
  const actions = usePlanActions();
  const [draft, setDraft] = React.useState<PlanDraft | null>(startEditing ? emptyDraft : null);
  const shown = draft === null ? plan : applyDraft(plan, draft);
  const edit = (change: (d: PlanDraft) => PlanDraft): void =>
    setDraft((d) => change(d ?? emptyDraft));
  return {
    editing: draft !== null,
    plan: shown,
    begin: () => setDraft(emptyDraft),
    cancel: () => setDraft(null),
    save: () => {
      if (draft !== null) void actions.saveDraft(draft);
      setDraft(null);
    },
    setBlock: (block) => edit((d) => ({ ...d, block })),
    toggle: (membershipId, change) =>
      edit((d) => {
        const now = applyDraft(plan, d);
        const m = now.memberships.find((x) => x.id === membershipId);
        return m === undefined ? d : draftSchedule(d, toggleDay(scheduleOf(now, m), change));
      }),
    setSchedules: (schedules) => edit((d) => schedules.reduce(draftSchedule, d)),
    setChange: (change) => edit((d) => draftChange(d, change)),
    move: (blockId, membershipId, by) =>
      edit((d) => draftMove(d, plan, { id: blockId }, membershipId, by)),
    remove: (membershipId) => edit((d) => draftRemove(d, membershipId)),
  };
}
