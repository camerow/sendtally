import type { LogSessionInput, PlanLink, SessionDetail } from "@sendtally/api-client";
import { withCircuit } from "../gyms/draft";
import type { Circuit, Gym } from "../gyms/types";
import { t } from "../i18n";
import { parseStoredDraft, type DraftStorage } from "./draftStore";
import { liveDraft } from "./liveSession";
import { newClimb, nextClimbKey, toLogSessionInput, withTries } from "./transforms";
import type { ClimbDraft, GradeScale, LogSessionDraft } from "./types";

export type TallyChoice =
  | { kind: "grade"; scale: GradeScale; grade: string }
  | { kind: "circuit"; gym: Gym; circuit: Circuit };

export type TallyGo = "fell" | "sent";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function clockTime(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export type TallyStart = {
  gymId?: string | undefined;
  plan?: PlanLink | undefined;
  /** The workout it was started from names it. */
  name?: string | undefined;
};

export function tallyDraft(now: Date, { gymId, plan, name }: TallyStart = {}): LogSessionDraft {
  return {
    ...liveDraft(now),
    ...(name === undefined || name === "" ? {} : { name }),
    startTime: clockTime(now),
    startedAt: now.toISOString(),
    ...(gymId === undefined ? {} : { gymId }),
    ...(plan === undefined || plan.membershipId === null ? {} : { plan }),
  };
}

/** Tries are the falls plus the send, so a flash is one try. */
export function withTallyGo(climb: ClimbDraft, go: TallyGo): ClimbDraft {
  if (go === "fell") return withTries(climb, climb.tries + 1);
  return withTries({ ...climb, kind: "send", style: "flash" }, climb.tries + 1);
}

/** The first go on a climb starts its row. */
export function newTallyClimb(
  draft: LogSessionDraft,
  choice: TallyChoice,
  go: TallyGo
): { draft: LogSessionDraft; key: string } {
  const key = nextClimbKey(draft.climbs);
  const fresh =
    choice.kind === "grade"
      ? { ...newClimb(key, choice.scale), grade: choice.grade }
      : withCircuit(newClimb(key, choice.gym.scale), choice.circuit, choice.gym);
  const climb = withTallyGo({ ...fresh, tries: 0 }, go);
  const gymId = draft.gymId ?? (choice.kind === "circuit" ? choice.gym.id : undefined);
  return {
    draft: {
      ...draft,
      ...(gymId === undefined ? {} : { gymId }),
      climbs: [...draft.climbs, climb],
    },
    key,
  };
}

export function tallySummary(draft: LogSessionDraft): string {
  if (draft.climbs.length === 0) return t("tally.noClimbsYet");
  const tries = draft.climbs.reduce((n, c) => n + c.tries, 0);
  const sent = draft.climbs.filter((c) => c.kind === "send").length;
  return `${t("tally.tryCount", { count: tries })} · ${t("tally.sentCount", { count: sent })}`;
}

/** Minutes since the session started, from its wall-clock start; a start after now ran past midnight. */
function elapsedMinutes(draft: LogSessionDraft, now: Date): number {
  const match = /^(\d{2}):(\d{2})$/.exec(draft.startTime);
  if (match === null) return 0;
  const started = Number(match[1]) * 60 + Number(match[2]);
  const minutes = now.getHours() * 60 + now.getMinutes() - started;
  return minutes >= 0 ? minutes : minutes + 24 * 60;
}

/** Seconds since the session started; one started before seconds were kept counts from its minute. */
export function tallyElapsedSeconds(draft: LogSessionDraft, now: Date): number {
  const started = Date.parse(draft.startedAt ?? "");
  if (Number.isNaN(started)) return elapsedMinutes(draft, now) * 60;
  return Math.max(0, Math.floor((now.getTime() - started) / 1000));
}

export type FinishApi = {
  logSession: (input: LogSessionInput) => Promise<{ session: SessionDetail }>;
  updateLoggedSession: (
    fingerprint: string,
    input: LogSessionInput
  ) => Promise<{ session: SessionDetail }>;
};

/**
 * Ends the live session, its one write to the server: saved with its end time and the effort
 * given, or scored by the server when none was, and the device copy goes. A session with no
 * climbs is simply dropped. Resolves to the saved session's fingerprint, or null when there was
 * nothing to save.
 */
export async function finishLiveSession(
  api: FinishApi,
  storage: DraftStorage,
  rpe: number | null,
  now: Date = new Date()
): Promise<string | null> {
  const stored = parseStoredDraft(storage.read(), now);
  if (stored === null) return null;
  if (stored.draft.climbs.length === 0) {
    storage.remove();
    return null;
  }
  const input = toLogSessionInput({ ...stored.draft, endTime: clockTime(now), rpe });
  const { session } =
    stored.fingerprint === undefined
      ? await api.logSession(input)
      : await api.updateLoggedSession(stored.fingerprint, input);
  storage.remove();
  return session.fingerprint;
}
