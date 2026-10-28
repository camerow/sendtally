import type { PlanLink } from "@sendtally/core/hang";

type RawParams = Partial<Record<string, string | string[]>>;

/** Logged on its own, against no plan. */
export const NO_PLAN: PlanLink = { membershipId: null, week: null };

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
  };
}

export function readPlanLink(p: RawParams): PlanLink {
  return { membershipId: first(p.membershipId) || null, week: whole(p.week) };
}

/** How many sessions of its workout came before a run: which dose each item takes. */
export const readSession = (p: RawParams): number => Math.max(0, whole(p.session) ?? 0);
