import type { PlanLink } from "@sendtally/core/hang";

type RawParams = Partial<Record<string, string | string[]>>;

/** Logged on its own, against no plan. */
export const NO_PLAN: PlanLink = { membershipId: null, week: null, variation: null };

const first = (v: string | string[] | undefined): string => (Array.isArray(v) ? v[0] : v) ?? "";

const whole = (v: string | string[] | undefined): number | null => {
  const n = Number(first(v));
  return first(v) === "" || !Number.isInteger(n) ? null : n;
};

/** The plan a run takes along through its routes, as params; none for a run on its own. */
export function planLinkParams(link: PlanLink): Record<string, string> {
  return {
    ...(link.membershipId === null ? {} : { membershipId: link.membershipId }),
    ...(link.week === null ? {} : { week: String(link.week) }),
    ...(link.variation === null ? {} : { variation: String(link.variation) }),
  };
}

export function readPlanLink(p: RawParams): PlanLink {
  return {
    membershipId: first(p.membershipId) || null,
    week: whole(p.week),
    variation: whole(p.variation),
  };
}
