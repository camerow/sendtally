import type { Activity, ActivityKind } from "@sendtally/api-client";
import { doneAsPrescribed, type ItemDone, type SessionItem } from "@sendtally/core/hang";
import { formatNumber, t } from "../i18n";
import { cleanDone } from "./done";
import { ACTIVITY_KINDS, kindLabel, trainingLoad } from "./format";

/** The activity form's state. Strings where the form edits text, `""` for an empty start time. */
export type ActivityDraft = {
  kind: ActivityKind;
  title: string;
  date: string;
  startTime: string;
  minutes: number;
  rpe: number | null;
  notes: string;
  workoutId: string | null;
  membershipId: string | null;
  week: number | null;
  done: ItemDone[];
  /** Items of `done` unticked before saving, which do not save. */
  skipped: number[];
};

/** What a doorway into the form may already know, straight from the route's query. */
export type ActivityPrefill = {
  kind?: string;
  title?: string;
  date?: string;
  workoutId?: string;
  membershipId?: string;
  week?: string;
  minutes?: string;
  /** "HH:MM", set when a player timed the run. */
  startTime?: string;
  /** What a player ran, as JSON, in place of what the workout prescribes. */
  done?: string;
  /** The items of `done` a checklist left unticked, as JSON. */
  skipped?: string;
};

export const MINUTES_STEP = 5;

const DEFAULT_MINUTES = 60;

const clampMinutes = (n: number): number => Math.min(1440, Math.max(1, Math.round(n)));

const wholeNumber = (text: string | undefined): number | null => {
  const n = Number(text);
  return text === undefined || text === "" || !Number.isInteger(n) ? null : n;
};

const isItemDone = (v: unknown): v is ItemDone => {
  if (typeof v !== "object" || v === null) return false;
  const { item, exercise, sets } = v as Partial<ItemDone>;
  return (
    typeof item === "number" &&
    typeof exercise === "string" &&
    Array.isArray(sets) &&
    sets.every((s: unknown) => typeof s === "object" && s !== null)
  );
};

const parseDone = (text: string | undefined): ItemDone[] | null => {
  if (text === undefined) return null;
  try {
    const done: unknown = JSON.parse(text);
    return Array.isArray(done) && done.every(isItemDone) ? done : null;
  } catch {
    return null;
  }
};

const parseSkipped = (text: string | undefined): number[] => {
  try {
    const skipped: unknown = JSON.parse(text ?? "[]");
    return Array.isArray(skipped) ? skipped.filter((n): n is number => Number.isInteger(n)) : [];
  } catch {
    return [];
  }
};

/** `prescribed` is what the workout asks of this session, which the activity starts as done. */
export function newActivityDraft(
  prefill: ActivityPrefill,
  today: string,
  prescribed: readonly SessionItem[] = []
): ActivityDraft {
  return {
    kind: ACTIVITY_KINDS.find((k) => k === prefill.kind) ?? "strength",
    title: prefill.title ?? "",
    date: prefill.date ?? today,
    startTime: prefill.startTime ?? "",
    minutes: parseMinutes(prefill.minutes ?? "") ?? DEFAULT_MINUTES,
    rpe: null,
    notes: "",
    workoutId: prefill.workoutId ?? null,
    membershipId: prefill.membershipId ?? null,
    week: wholeNumber(prefill.week),
    done: parseDone(prefill.done) ?? doneAsPrescribed(prescribed),
    skipped: parseSkipped(prefill.skipped),
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
    workoutId: a.workoutId,
    membershipId: a.membershipId,
    week: a.week,
    done: a.done,
    skipped: [],
  };
}

/** An untitled activity takes its kind's name, and an unticked item does not save. */
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
    workoutId: d.workoutId,
    membershipId: d.membershipId,
    week: d.week,
    done: cleanDone(d.done.filter((x) => !d.skipped.includes(x.item))),
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
