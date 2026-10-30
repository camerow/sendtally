import type { PlanLink } from "@sendtally/core/hang";
import { readFocus } from "@sendtally/features/training";

type RawParams = Partial<Record<string, string | string[]>>;

/** Logged on its own, against no plan and with no focus. */
export const NO_PLAN: PlanLink = { membershipId: null, week: null, focus: null };

const first = (v: string | string[] | undefined): string => (Array.isArray(v) ? v[0] : v) ?? "";

const whole = (v: string | string[] | undefined): number | null => {
  const n = Number(first(v));
  return first(v) === "" || !Number.isInteger(n) ? null : n;
};

/** The plan a run takes along through its routes, and the focus it started with, as params. */
export function planLinkParams(link: PlanLink): Record<string, string> {
  return {
    ...(link.membershipId === null ? {} : { membershipId: link.membershipId }),
    ...(link.week === null ? {} : { week: String(link.week) }),
    ...(link.focus === null ? {} : { focus: link.focus }),
  };
}

export function readPlanLink(p: RawParams): PlanLink {
  return {
    membershipId: first(p.membershipId) || null,
    week: whole(p.week),
    focus: readFocus(first(p.focus)) ?? null,
  };
}

/** How many sessions of its workout came before a run: which dose each item takes. */
export const readSession = (p: RawParams): number => Math.max(0, whole(p.session) ?? 0);
