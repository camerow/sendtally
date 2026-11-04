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

/** Where a climb was: a crag from Areas, or nowhere in particular. */
export type ClimbPlace = { area: { id: string; name: string } | null };

/**
 * The day's latest logged session; board history is never written to. Given a place, only the
 * day's outdoor session counts, whatever its areas, or with no area, one with no location.
 */
export function sessionOnDay(
  sessions: readonly SessionRow[],
  date: string,
  place?: ClimbPlace
): SessionRow | null {
  const here = (s: SessionRow): boolean =>
    place === undefined || s.location === (place.area === null ? null : "outdoor");
  return (
    sessions
      .filter((s) => s.source === "manual" && utcDate(s.start_at) === date && here(s))
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
 * a bare unscored session there, with no name, times or effort. With an area, it joins only an
 * outdoor session, and a new one is outdoors with the climb at that area.
 */
export async function logClimbOnDay(
  api: DayClimbApi,
  climb: Omit<ClimbDraft, "key">,
  date: string,
  gyms: readonly Gym[],
  place?: ClimbPlace
): Promise<void> {
  const { sessions } = await api.sessions();
  const row = sessionOnDay(sessions, date, place);
  const area = place?.area ?? null;
  const placed = area === null ? climb : { ...climb, area: { id: area.id, name: area.name } };
  if (row === null) {
    const draft: LogSessionDraft = {
      ...liveDraft(new Date()),
      name: "",
      date,
      ...(area === null ? {} : { location: "outdoor" as const }),
      climbs: [{ ...placed, key: "climb-1" }],
    };
    await api.logSession(toLiveSessionInput(withGymAdopted(draft, gyms)));
    return;
  }
  const { session } = await api.session(row.fingerprint);
  const existing = draftFromSession(session);
  const climbs = [...existing.climbs, { ...placed, key: nextClimbKey(existing.climbs) }];
  const draft = withGymAdopted({ ...existing, climbs }, gyms);
  await api.updateLoggedSession(row.fingerprint, dayInput(session, draft));
}
