import type { ClimbSummary } from "@sendtally/api-client";
import { climbDraftGrade } from "../climbs/transforms";
import { formatDate, t } from "../i18n";
import { parseStoredDraft, type DraftStorage, type StoredSessionDraft } from "./draftStore";
import type { Gym } from "../gyms/types";
import { gymOfCircuit, newClimbOfKind, type ClimbKind } from "./climbKind";
import { nextClimbKey } from "./transforms";
import {
  DEFAULT_GRADE_PREFS,
  type ClimbDraft,
  type GradePrefs,
  type LogSessionDraft,
} from "./types";

/** Climbs logged one at a time, as they happen; details are added afterwards. */

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** The device-local calendar date, as a draft stores it. */
export function localDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function defaultSessionName(now: Date): string {
  const hour = now.getHours();
  const date = formatDate(now, { dateStyle: "short" });
  if (hour < 12) return t("logSession.defaultNameMorning", { date });
  if (hour < 17) return t("logSession.defaultNameAfternoon", { date });
  return t("logSession.defaultNameEvening", { date });
}

/** Starts at the first climb; times are the climber's to add later. */
export function liveDraft(now: Date): LogSessionDraft {
  return {
    name: defaultSessionName(now),
    date: localDate(now),
    startTime: "",
    endTime: "",
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
  return { draft: next, key };
}

/** A session without a gym adopts the gym of its first circuit climb, however that climb got its circuit. */
export function withGymAdopted(draft: LogSessionDraft, gyms: readonly Gym[]): LogSessionDraft {
  if (draft.gymId !== undefined) return draft;
  const gymId = draft.climbs
    .map((c) => gymOfCircuit(gyms, c.circuit?.id)?.id)
    .find((id) => id !== undefined);
  return gymId === undefined ? draft : { ...draft, gymId };
}

/**
 * The draft being climbed today. An older draft the server already has is dropped from the
 * file, since its row is in the log; an older one it does not have stays for the form to offer.
 */
export function liveStoredDraft(storage: DraftStorage, now: Date): StoredSessionDraft | null {
  const entry = parseStoredDraft(storage.read(), now);
  if (entry === null) return null;
  if (entry.draft.date === localDate(now)) return entry;
  if (entry.fingerprint !== undefined) storage.remove();
  return null;
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
