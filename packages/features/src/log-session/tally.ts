import type { PlanLink } from "@sendtally/api-client";
import { withCircuit } from "../gyms/draft";
import type { Circuit, Gym } from "../gyms/types";
import { t } from "../i18n";
import { liveDraft } from "./liveSession";
import { newClimb, nextClimbKey, withTries } from "./transforms";
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

export function tallyDraft(
  now: Date,
  { gymId, plan }: { gymId?: string | undefined; plan?: PlanLink | undefined } = {}
): LogSessionDraft {
  return {
    ...liveDraft(now),
    startTime: clockTime(now),
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
export function tallyElapsedMinutes(draft: LogSessionDraft, now: Date): number {
  const match = /^(\d{2}):(\d{2})$/.exec(draft.startTime);
  if (match === null) return 0;
  const started = Number(match[1]) * 60 + Number(match[2]);
  const minutes = now.getHours() * 60 + now.getMinutes() - started;
  return minutes >= 0 ? minutes : minutes + 24 * 60;
}

export function tallyClock(minutes: number): string {
  return `${Math.floor(minutes / 60)}:${pad(minutes % 60)}`;
}
