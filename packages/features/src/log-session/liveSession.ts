import type { ClimbSummary } from "@sendtally/api-client";
import { climbDraftGrade } from "../climbs/transforms";
import { formatDate, t } from "../i18n";
import type { Gym } from "../gyms/types";
import { gymOfCircuit, newClimbOfKind, type ClimbKind } from "./climbKind";
import { nextClimbKey } from "./transforms";
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

/**
 * Each new climb is graded the way the climber last picked, so most taps change nothing. A session
 * without a gym adopts the gym of the first circuit climb.
 */
export function withQuickClimb(
  draft: LogSessionDraft | null,
  now: Date,
  prefs: GradePrefs = DEFAULT_GRADE_PREFS,
  gyms: readonly Gym[] = [],
  kind: ClimbKind = "boulder"
): { draft: LogSessionDraft; key: string } {
  const started = draft ?? liveDraft(now);
  const key = nextClimbKey(started.climbs);
  const previous = started.climbs[started.climbs.length - 1];
  const climb = newClimbOfKind(key, kind, prefs, gyms, previous);
  const next = withGymAdopted({ ...started, climbs: [...started.climbs, climb] }, gyms);
  return { draft: withClimbTouched(next, now), key };
}

/** A session without a gym adopts the gym of its first circuit climb, however that climb got its circuit. */
export function withGymAdopted(draft: LogSessionDraft, gyms: readonly Gym[]): LogSessionDraft {
  if (draft.gymId !== undefined) return draft;
  const gymId = draft.climbs
    .map((c) => gymOfCircuit(gyms, c.circuit?.id)?.id)
    .find((id) => id !== undefined);
  return gymId === undefined ? draft : { ...draft, gymId };
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

/** hh:mm:ss since the draft's start, clamped at zero. */
export function elapsedLabel(draft: LogSessionDraft, now: Date): string {
  const started = new Date(`${draft.date}T${draft.startTime}:00`);
  const total = Math.max(0, Math.floor((now.getTime() - started.getTime()) / 1000));
  if (Number.isNaN(total)) return "00:00:00";
  const pad = (n: number): string => String(n).padStart(2, "0");
  return `${pad(Math.floor(total / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;
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
  return { ...withClimbName(climb, known.name, known), project: known.project || undefined };
}
