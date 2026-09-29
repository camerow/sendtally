import type {
  LogSessionInput,
  SendtallyApi,
  SessionDetail,
  SessionRow,
} from "@sendtally/api-client";
import type { Gym } from "../gyms/types";
import { isUnscored } from "../sessions/meta";
import { liveDraft, withGymAdopted } from "./liveSession";
import {
  draftFromSession,
  nextClimbKey,
  toLiveSessionInput,
  toLogSessionInput,
  utcDate,
} from "./transforms";
import type { ClimbDraft, LogSessionDraft } from "./types";

export type DayClimbApi = Pick<
  SendtallyApi,
  "sessions" | "session" | "logSession" | "updateLoggedSession"
>;

/** The day's latest logged session; board history is never written to. */
export function sessionOnDay(sessions: readonly SessionRow[], date: string): SessionRow | null {
  return (
    sessions
      .filter((s) => s.source === "manual" && utcDate(s.start_at) === date)
      .sort((a, b) => b.start_at.localeCompare(a.start_at))[0] ?? null
  );
}

/** A computed effort is scored again with the new climb; one the climber gave stands. */
function dayInput(session: SessionDetail, draft: LogSessionDraft): LogSessionInput {
  if (isUnscored(session)) return toLiveSessionInput(draft);
  return toLogSessionInput(session.rpe_source === "computed" ? { ...draft, rpe: null } : draft);
}

/**
 * A climb logged for a day other than the live one joins that day's latest session, or starts
 * a bare unscored session there, with no name, times, effort or venue.
 */
export async function logClimbOnDay(
  api: DayClimbApi,
  climb: ClimbDraft,
  date: string,
  gyms: readonly Gym[]
): Promise<void> {
  const { sessions } = await api.sessions();
  const row = sessionOnDay(sessions, date);
  if (row === null) {
    const draft = {
      ...liveDraft(new Date()),
      name: "",
      date,
      climbs: [{ ...climb, key: "climb-1" }],
    };
    await api.logSession(toLiveSessionInput(withGymAdopted(draft, gyms)));
    return;
  }
  const { session } = await api.session(row.fingerprint);
  const existing = draftFromSession(session);
  const climbs = [...existing.climbs, { ...climb, key: nextClimbKey(existing.climbs) }];
  const draft = withGymAdopted({ ...existing, climbs }, gyms);
  await api.updateLoggedSession(row.fingerprint, dayInput(session, draft));
}
