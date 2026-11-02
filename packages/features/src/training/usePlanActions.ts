import { useQueryClient } from "@tanstack/react-query";
import React from "react";
import type { Plan, SendtallyApi } from "@sendtally/api-client";
import type { Block, Membership, PlanChange, WeekChange } from "@sendtally/core/hang";
import { queries } from "../query";
import { withoutBlock, withoutMembership } from "./plan";
import { changedSchedules, movedWith, withChange, withSchedule, type PlanDraft } from "./planDraft";
import type { DaySchedule } from "./weekDays";

export type PlanActions = {
  saveBlock: (block: Block) => Promise<void>;
  /** Its memberships go with it. */
  deleteBlock: (id: string) => Promise<void>;
  saveMembership: (membership: Membership) => Promise<void>;
  /** Its week changes go with it. */
  deleteMembership: (id: string) => Promise<void>;
  /** An empty change puts the item back as written for that week. */
  saveWeekChange: (change: WeekChange) => Promise<void>;
  /** Skips or moves one planned day, replacing any change it had. */
  savePlanChange: (change: PlanChange) => Promise<void>;
  /** Replaces a membership's days: its own weekdays and each block week they change from. */
  saveSchedule: (schedule: DaySchedule) => Promise<void>;
  /** Saves what a draft holds: the block, the plans that move with it, days and load. */
  saveDraft: (draft: PlanDraft) => Promise<void>;
  /** Undoes a skip or move: the day is planned as it was. */
  undoPlanChange: (membershipId: string, plannedOn: string) => Promise<void>;
  /** Plans `from` again as block `to` from `start`, with its plans; false when it failed. */
  copyBlock: (from: string, to: string, start: string | null) => Promise<boolean>;
};

const upsert = <T extends { id: string }>(list: readonly T[], item: T): T[] =>
  list.some((x) => x.id === item.id)
    ? list.map((x) => (x.id === item.id ? item : x))
    : [...list, item];

// ponytail: one chain for every plan write, as in useHangActions, so quick taps
// reach the server in the order they were made.
let chain: Promise<unknown> = Promise.resolve();

/**
 * Writes apply to the cache at once and go to the server in order behind it.
 * A failed write refetches, so the screen falls back to what the server holds,
 * and is reported through `onError`; the returned promises never reject.
 */
export function usePlanActions(api: SendtallyApi, onError: (error: unknown) => void): PlanActions {
  const client = useQueryClient();
  return React.useMemo((): PlanActions => {
    const key = queries.plan(api).queryKey;
    const write = async (patch: (plan: Plan) => Plan, request: () => Promise<unknown>) => {
      // Patched before anything awaits, so a screen opened with the write already reads it; a
      // fetch in flight is stopped without putting back what it started from.
      client.setQueryData<Plan>(key, (plan) => (plan === undefined ? plan : patch(plan)));
      await client.cancelQueries({ queryKey: key }, { revert: false });
      const next = chain.then(request);
      chain = next.catch(() => undefined);
      try {
        await next;
      } catch (error) {
        onError(error);
        await client.invalidateQueries({ queryKey: key });
      }
    };
    const saveSchedule = (next: DaySchedule): Promise<void> =>
      write(
        (p) => withSchedule(p, next),
        () => api.saveSchedule(next)
      );
    const saveBlock = (block: Block): Promise<void> =>
      write(
        (p) => ({ ...p, blocks: upsert(p.blocks, block) }),
        () => api.saveBlock(block)
      );
    const saveMembership = (membership: Membership): Promise<void> =>
      write(
        (p) => ({ ...p, memberships: upsert(p.memberships, membership) }),
        () => api.saveMembership(membership)
      );
    const saveWeekChange = (change: WeekChange): Promise<void> =>
      write(
        (p) => withChange(p, change),
        () => api.saveWeekChange(change)
      );
    return {
      saveBlock,
      deleteBlock: (id) =>
        write(
          (p) => withoutBlock(p, id),
          () => api.deleteBlock(id)
        ),
      saveMembership,
      deleteMembership: (id) =>
        write(
          (p) => withoutMembership(p, id),
          () => api.deleteMembership(id)
        ),
      saveWeekChange,
      savePlanChange: (change) =>
        write(
          (p) => ({
            ...p,
            planChanges: [
              ...p.planChanges.filter(
                (c) => c.membershipId !== change.membershipId || c.plannedOn !== change.plannedOn
              ),
              change,
            ],
          }),
          () => api.savePlanChange(change)
        ),
      saveSchedule: (next) => saveSchedule(next),
      saveDraft: async (draft) => {
        const plan = client.getQueryData<Plan>(key);
        if (plan === undefined) return;
        const moved = draft.block === null ? [] : movedWith(plan, draft.block);
        await Promise.all([
          ...(draft.block === null ? [] : [saveBlock(draft.block)]),
          ...moved.map(saveMembership),
          ...changedSchedules(plan, draft).map(saveSchedule),
          ...draft.weekChanges.map(saveWeekChange),
        ]);
      },
      undoPlanChange: (membershipId, plannedOn) =>
        write(
          (p) => ({
            ...p,
            planChanges: p.planChanges.filter(
              (c) => c.membershipId !== membershipId || c.plannedOn !== plannedOn
            ),
          }),
          () => api.deletePlanChange(membershipId, plannedOn)
        ),
      copyBlock: async (from, to, start) => {
        try {
          await api.copyBlock(from, to, start);
          await client.invalidateQueries({ queryKey: key });
          return true;
        } catch (error) {
          onError(error);
          return false;
        }
      },
    };
  }, [api, client, onError]);
}
