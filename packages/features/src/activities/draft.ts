import type { Activity, ActivityDetail, ActivityKind, PlanTemplate } from "@sendtally/api-client";
import { formatNumber, t } from "../i18n";
import { cleanDetail, detailFromTemplate } from "./detail";
import { ACTIVITY_KINDS, kindLabel } from "./format";
import { trainingLoad } from "./plan";

/** The activity form's state. Strings where the form edits text, `""` for an empty start time. */
export type ActivityDraft = {
  kind: ActivityKind;
  title: string;
  date: string;
  startTime: string;
  minutes: number;
  rpe: number | null;
  notes: string;
  planItemId: string | null;
  detail: ActivityDetail | null;
};

/** What a doorway into the form may already know, straight from the route's query. */
export type ActivityPrefill = {
  kind?: string;
  title?: string;
  date?: string;
  planItemId?: string;
  minutes?: string;
};

export const MINUTES_STEP = 5;

const DEFAULT_MINUTES = 60;

const clampMinutes = (n: number): number => Math.min(1440, Math.max(1, Math.round(n)));

/** `template` is the plan item's, whose sets and items the activity starts from. */
export function newActivityDraft(
  prefill: ActivityPrefill,
  today: string,
  template: PlanTemplate | null = null
): ActivityDraft {
  return {
    kind: ACTIVITY_KINDS.find((k) => k === prefill.kind) ?? "strength",
    title: prefill.title ?? "",
    date: prefill.date ?? today,
    startTime: "",
    minutes: parseMinutes(prefill.minutes ?? "") ?? DEFAULT_MINUTES,
    rpe: null,
    notes: "",
    planItemId: prefill.planItemId ?? null,
    detail: detailFromTemplate(template),
  };
}

export function draftFromActivity(a: Activity): ActivityDraft {
  return {
    kind: a.kind,
    title: a.title,
    date: a.date,
    startTime: a.startTime ?? "",
    minutes: a.minutes,
    rpe: a.rpe,
    notes: a.notes ?? "",
    planItemId: a.planItemId,
    detail: a.detail,
  };
}

/** An untitled activity takes its kind's name. */
export function activityFromDraft(id: string, d: ActivityDraft): Activity {
  const title = d.title.trim();
  const notes = d.notes.trim();
  return {
    id,
    kind: d.kind,
    title: title === "" ? kindLabel(d.kind) : title.slice(0, 80),
    date: d.date,
    startTime: d.startTime === "" ? null : d.startTime,
    minutes: clampMinutes(d.minutes),
    rpe: d.rpe,
    notes: notes === "" ? null : notes,
    planItemId: d.planItemId,
    detail: cleanDetail(d.detail),
  };
}

/** Plus or minus lands on the next multiple of the step, never below one minute. */
export function stepMinutes(minutes: number, direction: 1 | -1): number {
  const next =
    direction === 1
      ? Math.floor(minutes / MINUTES_STEP) * MINUTES_STEP + MINUTES_STEP
      : Math.ceil(minutes / MINUTES_STEP) * MINUTES_STEP - MINUTES_STEP;
  return clampMinutes(next);
}

/** Typed minutes, or null for text that is not a number. */
export function parseMinutes(text: string): number | null {
  const n = Number(text.trim());
  return text.trim() === "" || !Number.isFinite(n) ? null : clampMinutes(n);
}

/** "50 min × 7 = 350", or null until there is an effort to multiply by. */
export function trainingLoadLabel(d: Pick<ActivityDraft, "minutes" | "rpe">): string | null {
  const load = trainingLoad(d);
  if (load === null || d.rpe === null) return null;
  return t("activities.loadFormula", {
    minutes: formatNumber(d.minutes),
    rpe: d.rpe,
    load: formatNumber(load),
  });
}
