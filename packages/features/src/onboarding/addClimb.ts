import type { ClimbPillKind } from "../climbs/log";
import { formatDate, t } from "../i18n";
import { disciplineOf, draftGradeLabel } from "../log-session/transforms";
import { disciplineLabel, type ClimbDraft, type Discipline } from "../log-session/types";
import type { GradeScales } from "../sessions/grades";

export type AddOutcome = "flash" | "send" | "project";

export type AddedClimb = {
  key: string;
  gradeLabel: string;
  name: string;
  when: string;
  outcome: AddOutcome;
};

export type AddedWhen = { year: number; day: string | null };

export const ADD_OUTCOMES = ["flash", "send", "project"] as const;

const PILL: Record<AddOutcome, ClimbPillKind> = {
  flash: "flash",
  send: "sent",
  project: "project",
};

export const addOutcomeLabel = (o: AddOutcome): string =>
  o === "flash"
    ? t("logSession.styleFlash")
    : o === "send"
      ? t("common.sent")
      : t("common.project");

export const addOutcomePill = (o: AddOutcome): { kind: ClimbPillKind; label: string } => ({
  kind: PILL[o],
  label: addOutcomeLabel(o),
});

export const needsClimbName = (climb: ClimbDraft, outcome: AddOutcome): boolean =>
  outcome === "project" && climb.name.trim() === "";

/** The climb as the log stores it: Flash and Sent are sends of one try, a Project an attempt kept as one. */
export const asLogged = (climb: ClimbDraft, outcome: AddOutcome): Omit<ClimbDraft, "key"> => {
  const { key: _key, project: _project, ...rest } = climb;
  return {
    ...rest,
    name: climb.name.trim(),
    kind: outcome === "project" ? "attempt" : "send",
    style: outcome === "flash" ? "flash" : "redpoint",
    tries: 1,
    ...(outcome === "project" ? { project: true } : {}),
  };
};

export const addedClimb = (
  key: string,
  climb: ClimbDraft,
  outcome: AddOutcome,
  { year, day }: AddedWhen,
  scales: GradeScales
): AddedClimb => ({
  key,
  gradeLabel: draftGradeLabel(climb, scales),
  name: climb.name.trim() === "" ? disciplineLabel(disciplineOf(climb.scale)) : climb.name.trim(),
  when:
    day === null
      ? String(year)
      : formatDate(new Date(`${day}T00:00:00Z`), {
          timeZone: "UTC",
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
  outcome,
});

export const climbAddedEvent = (
  climb: ClimbDraft,
  outcome: AddOutcome,
  day: string | null
): { kind: Discipline; outcome: AddOutcome; dated: "year" | "day" } => ({
  kind: disciplineOf(climb.scale),
  outcome,
  dated: day === null ? "year" : "day",
});

export const sendsAdded = (added: readonly AddedClimb[]): number =>
  added.filter((a) => a.outcome !== "project").length;
