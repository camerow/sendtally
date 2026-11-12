import { randomUUID } from "expo-crypto";
import { isDated, type Block, type CalendarDate, type Membership } from "@sendtally/core/hang";
import {
  blockDates,
  nextPosition,
  trainingDay,
  useTrainingLog,
  ongoingMembers,
} from "@sendtally/features/training";
import { useApi } from "../../../lib/api";
import { useHangData } from "../data/HangDataContext";
import { usePlanActions } from "../plan/usePlanActions";
import type { AddFlow } from "./flowParams";

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
export function useAddTo(flow: AddFlow): AddTo {
  const { today } = useHangData();
  const { log } = useTrainingLog(useApi());
  const actions = usePlanActions();
  const block =
    flow.blockId === null ? undefined : log.plan.blocks.find((b) => b.id === flow.blockId);
  const day = flow.date;
  return {
    add: (workoutId) => {
      const id = randomUUID();
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
