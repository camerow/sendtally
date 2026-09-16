import type { ClimbSummary } from "@sendtally/api-client";
import { climbDraftGrade } from "../climbs/transforms";
import { formatDate, t } from "../i18n";
import { newClimb, nextClimbKey } from "./transforms";
import {
  DEFAULT_GRADE_PREFS,
  type ClimbDraft,
  type GradePrefs,
  type LogSessionDraft,
} from "./types";

/** Climbs logged one at a time, as they happen; the session is wrapped up afterwards. */

export const WRAP_UP_REMINDER_MINUTES = 120;

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function hhmm(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function ymd(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function defaultSessionName(now: Date): string {
  const hour = now.getHours();
  const date = formatDate(now, { dateStyle: "short" });
  if (hour < 12) return t("logSession.defaultNameMorning", { date });
  if (hour < 17) return t("logSession.defaultNameAfternoon", { date });
  return t("logSession.defaultNameEvening", { date });
}

/** Starts at the first climb and, until wrap-up, ends at the latest one. */
export function liveDraft(now: Date): LogSessionDraft {
  return {
    name: defaultSessionName(now),
    date: ymd(now),
    startTime: hhmm(now),
    endTime: hhmm(now),
    location: "indoor",
    tags: [],
    notes: "",
    rpe: null,
    climbs: [],
  };
}

export function withQuickClimb(
  draft: LogSessionDraft | null,
  now: Date,
  prefs: GradePrefs = DEFAULT_GRADE_PREFS
): { draft: LogSessionDraft; key: string } {
  const base = draft ?? liveDraft(now);
  const key = nextClimbKey(base.climbs);
  const previous = base.climbs[base.climbs.length - 1];
  const climb = newClimb(key, previous?.scale ?? prefs.boulder);
  return { draft: { ...base, endTime: hhmm(now), climbs: [...base.climbs, climb] }, key };
}

export function withClimbTouched(draft: LogSessionDraft, now: Date): LogSessionDraft {
  return draft.date === ymd(now) ? { ...draft, endTime: hhmm(now) } : draft;
}

/** Minutes since the last climb was logged, or null once the session is on another day. */
export function idleMinutes(draft: LogSessionDraft, now: Date): number | null {
  if (draft.date !== ymd(now)) return null;
  const [h, m] = draft.endTime.split(":").map(Number);
  if (h === undefined || m === undefined || Number.isNaN(h) || Number.isNaN(m)) return null;
  return Math.max(0, now.getHours() * 60 + now.getMinutes() - (h * 60 + m));
}

export function wantsWrapUpReminder(draft: LogSessionDraft, now: Date): boolean {
  const idle = idleMinutes(draft, now);
  return draft.climbs.length > 0 && (idle === null || idle >= WRAP_UP_REMINDER_MINUTES);
}

/**
 * A typed name drops any project flag the user set by hand and adopts the known climb's
 * grade. A project added from the projects page has no grade yet, so the one already
 * picked stands.
 */
export function withClimbName(
  climb: ClimbDraft,
  name: string,
  known: ClimbSummary | undefined
): ClimbDraft {
  const grade = known === undefined ? "" : climbDraftGrade(known, climb.scale);
  return { ...climb, name, project: undefined, ...(grade === "" ? {} : { grade }) };
}

export function withPickedClimb(climb: ClimbDraft, known: ClimbSummary): ClimbDraft {
  return withClimbName(climb, known.name, known);
}
