import { isDated, type Block, type CalendarDate, type Membership } from "@sendtally/core/hang";
import type { SendtallyApi } from "@sendtally/api-client";
import type { AddFlow } from "./addFlow";
import { nextPosition } from "./blocks";
import { trainingDay } from "./days";
import { ongoingMembers } from "./planGridRows";
import { blockDates } from "./schedule";
import type { PlanActions } from "./usePlanActions";
import { useTrainingLog } from "./useTrainingLog";

/** Where an add puts a workout, and whether a plan is already there. */
export type AddTo = {
  /**
   * Plans the workout: on the day, in its block when it has one, or in a block with no days yet.
   * Returns the plan's id.
   */
  add: (workoutId: string) => string;
  /** Takes back a plan just added. */
  undo: (membershipId: string) => void;
  /** Every plan where the add goes: in the block, or landing on the day. */
  plans: Membership[];
};

export type AddToOptions = {
  newId: () => string;
  /** The app's plan writes, with its own way of saying one failed. */
  actions: PlanActions;
  /** After each add, such as mobile's reminder prompt. */
  onAdded?: () => void;
};

/** A workout in a block with no days yet, starting when the block does. */
export const blockMembership = (
  id: string,
  workoutId: string,
  block: Block,
  today: CalendarDate,
  position: number
): Membership => ({
  id,
  workoutId,
  blockId: block.id,
  weekdays: [],
  start: block.start ?? today,
  position,
});

/** Adding workouts to a block or a day, as the add sheet and a workout's preview both do. */
export function useAddTo(
  api: SendtallyApi,
  flow: AddFlow,
  today: CalendarDate,
  { newId, actions, onAdded }: AddToOptions
): AddTo {
  const { log } = useTrainingLog(api);
  const block =
    flow.blockId === null ? undefined : log.plan.blocks.find((b) => b.id === flow.blockId);
  const day = flow.date;
  return {
    add: (workoutId) => {
      const id = newId();
      if (block === undefined)
        void actions.saveMembership({
          id,
          workoutId,
          blockId: null,
          weekdays: [],
          start: day ?? today,
          position: 0,
        });
      else {
        void actions.saveMembership(
          blockMembership(id, workoutId, block, today, nextPosition(log.plan, block.id))
        );
        // A day in a scheduled block: that day's weekday in its week.
        if (day !== null && isDated(block)) void actions.saveSchedule(blockDates(id, block, [day]));
      }
      onAdded?.();
      return id;
    },
    undo: (membershipId) => void actions.deleteMembership(membershipId),
    plans:
      day !== null
        ? trainingDay(log, day, today).plans.map((o) => o.membership)
        : flow.blockId === null
          ? ongoingMembers(log.plan, today)
          : log.plan.memberships.filter((m) => m.blockId === flow.blockId),
  };
}
