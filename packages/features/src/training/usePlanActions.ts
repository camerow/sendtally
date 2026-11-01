import { useQueryClient } from "@tanstack/react-query";
import React from "react";
import type { Plan, SendtallyApi } from "@sendtally/api-client";
import type { Block, Membership, PlanChange, Weekday, WeekChange } from "@sendtally/core/hang";
import { queries } from "../query";
import { withoutBlock, withoutMembership } from "./plan";
import { daysInWeek, scheduleOf, usualDays, withWeekDays, type DaySchedule } from "./weekDays";

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
  /**
   * Turns one weekday on or off in a block week, for that week alone or for it and every
   * week after, reading the days as they are in the cache when it lands. `every` turns it
   * on or off the days most weeks from it land on, for it and every week after.
   */
  toggleWeekDay: (
    membershipId: string,
    change: { week: number; day: Weekday; following: boolean; last: number; every?: boolean }
  ) => Promise<void>;
  /** Undoes a skip or move: the day is planned as it was. */
  undoPlanChange: (membershipId: string, plannedOn: string) => Promise<void>;
  /** Plans `from` again as block `to` from `start`, with its plans; false when it failed. */
  copyBlock: (from: string, to: string, start: string | null) => Promise<boolean>;
};

const upsert = <T extends { id: string }>(list: readonly T[], item: T): T[] =>
  list.some((x) => x.id === item.id)
    ? list.map((x) => (x.id === item.id ? item : x))
    : [...list, item];

const sameRung = (a: WeekChange, b: WeekChange): boolean =>
  a.membershipId === b.membershipId && a.week === b.week && a.dose === b.dose && a.item === b.item;

function withChange(plan: Plan, change: WeekChange): Plan {
  const rest = plan.weekChanges.filter((c) => !sameRung(c, change));
  const empty = Object.keys(change.change).length === 0;
  return { ...plan, weekChanges: empty ? rest : [...rest, change] };
}

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
      await client.cancelQueries({ queryKey: key });
      client.setQueryData<Plan>(key, (plan) => (plan === undefined ? plan : patch(plan)));
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
        (p) => ({
          ...p,
          memberships: p.memberships.map((x) =>
            x.id === next.membershipId ? { ...x, weekdays: next.weekdays } : x
          ),
          membershipDays: [
            ...p.membershipDays.filter((d) => d.membershipId !== next.membershipId),
            ...next.weeks,
          ],
        }),
        () => api.saveSchedule(next)
      );
    return {
      saveBlock: (block) =>
        write(
          (p) => ({ ...p, blocks: upsert(p.blocks, block) }),
          () => api.saveBlock(block)
        ),
      deleteBlock: (id) =>
        write(
          (p) => withoutBlock(p, id),
          () => api.deleteBlock(id)
        ),
      saveMembership: (membership) =>
        write(
          (p) => ({ ...p, memberships: upsert(p.memberships, membership) }),
          () => api.saveMembership(membership)
        ),
      deleteMembership: (id) =>
        write(
          (p) => withoutMembership(p, id),
          () => api.deleteMembership(id)
        ),
      saveWeekChange: (change) =>
        write(
          (p) => withChange(p, change),
          () => api.saveWeekChange(change)
        ),
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
      toggleWeekDay: async (membershipId, { week, day, following, last, every = false }) => {
        const plan = client.getQueryData<Plan>(key);
        const m = plan?.memberships.find((x) => x.id === membershipId);
        if (plan === undefined || m === undefined) return;
        const schedule = scheduleOf(plan, m);
        const days = every ? usualDays(schedule, week, last) : daysInWeek(schedule, week);
        await saveSchedule(
          withWeekDays(schedule, {
            week,
            weekdays: days.includes(day) ? days.filter((d) => d !== day) : [...days, day],
            following: following || every,
            last,
          })
        );
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
