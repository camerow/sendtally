import type { Activity, ActivityKind } from "@sendtally/api-client";
import {
  doneAsPrescribed,
  type Focus,
  type ItemDone,
  type SessionItem,
} from "@sendtally/core/hang";
import { readFocus } from "../training/focus";
import { cleanDone, keptSets } from "./done";
import { ACTIVITY_KINDS, kindLabel } from "./format";

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
  focus: Focus | null;
  done: ItemDone[];
  /** Sets of `done` toggled off before saving, by `setKeyOf`, which do not save. */
  off: string[];
};

/** What a doorway into the form may already know, straight from the route's query. */
export type ActivityPrefill = {
  kind?: string;
  title?: string;
  date?: string;
  workoutId?: string;
  membershipId?: string;
  week?: string;
  /** The focus a run recorded when it started. */
  focus?: string;
  minutes?: string;
  /** "HH:MM", set when a player timed the run. */
  startTime?: string;
  /** What a player ran, as JSON, in place of what the workout prescribes. */
  done?: string;
  /** The sets of `done` a player did not finish, as JSON keys. */
  off?: string;
};

const DEFAULT_MINUTES = 60;

const clampMinutes = (n: number): number => Math.min(1440, Math.max(1, Math.round(n)));

/** A length typed in seconds as the whole minutes an activity keeps, one to a day. */
export const minutesOf = (seconds: number): number => clampMinutes(seconds / 60);

const minutesParam = (text: string | undefined): number | null => {
  const n = Number(text);
  return text === undefined || text.trim() === "" || !Number.isFinite(n) ? null : clampMinutes(n);
};

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

const parseOff = (text: string | undefined): string[] => {
  try {
    const off: unknown = JSON.parse(text ?? "[]");
    return Array.isArray(off) ? off.filter((k): k is string => typeof k === "string") : [];
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
    minutes: minutesParam(prefill.minutes) ?? DEFAULT_MINUTES,
    rpe: null,
    notes: "",
    workoutId: prefill.workoutId ?? null,
    membershipId: prefill.membershipId ?? null,
    week: wholeNumber(prefill.week),
    focus: readFocus(prefill.focus) ?? null,
    done: parseDone(prefill.done) ?? doneAsPrescribed(prescribed),
    off: parseOff(prefill.off),
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
    focus: a.focus ?? null,
    done: a.done,
    off: [],
  };
}

/** An untitled activity takes its kind's name, and a set toggled off does not save. */
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
    focus: d.focus,
    done: cleanDone(keptSets(d.done, d.off)),
  };
}
