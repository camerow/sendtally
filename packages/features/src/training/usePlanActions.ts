import { useQueryClient } from "@tanstack/react-query";
import React from "react";
import type { Plan, SendtallyApi } from "@sendtally/api-client";
import type { Block, Membership, WeekChange } from "@sendtally/core/hang";
import { queries } from "../query";
import { withoutBlock, withoutMembership } from "./plan";

export type PlanActions = {
  saveBlock: (block: Block) => Promise<void>;
  /** Its memberships go with it. */
  deleteBlock: (id: string) => Promise<void>;
  saveMembership: (membership: Membership) => Promise<void>;
  /** Its week changes go with it. */
  deleteMembership: (id: string) => Promise<void>;
  /** An empty change puts the item back as written for that week. */
  saveWeekChange: (change: WeekChange) => Promise<void>;
};

const upsert = <T extends { id: string }>(list: readonly T[], item: T): T[] =>
  list.some((x) => x.id === item.id)
    ? list.map((x) => (x.id === item.id ? item : x))
    : [...list, item];

const sameRung = (a: WeekChange, b: WeekChange): boolean =>
  a.membershipId === b.membershipId &&
  a.week === b.week &&
  a.variation === b.variation &&
  a.item === b.item;

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
    };
  }, [api, client, onError]);
}
