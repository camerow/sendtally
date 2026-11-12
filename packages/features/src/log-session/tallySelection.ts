import { circuitLabel } from "../gyms/transforms";
import { t } from "../i18n";
import { withExerciseClimb } from "./exerciseTally";
import { newTallyClimb, withTallyGo, type TallyChoice, type TallyGo } from "./tally";
import { durationLabel, vGradeOf } from "./transforms";
import type { ClimbDraft, LogSessionDraft } from "./types";

/** What Fell and Sent act on: a climb already on the list, or a grade picked for a new one. */
export type TallySelection =
  { kind: "row"; key: string } | { kind: "pending"; chip: string } | null;

/** The go just logged, kept with the state before it so Undo can put that back. */
export type TallyUndo = {
  id: number;
  message: string;
  draft: LogSessionDraft;
  selection: TallySelection;
};

export type TallyStep = {
  draft: LogSessionDraft;
  selection: TallySelection;
  undo: TallyUndo;
};

/** A circuit climb reads as its circuit, anything else as its grade. */
export function tallyGradeOf(climb: ClimbDraft): string {
  return climb.circuit === undefined ? climb.grade : circuitLabel(climb.circuit);
}

/**
 * Fell or Sent on the selection. A pending grade starts a climb, which stays selected after
 * a fall; a sent climb lets go of the selection. Null when there is nothing to act on.
 */
export function tallyStep(
  draft: LogSessionDraft,
  selection: TallySelection,
  go: TallyGo,
  choiceOf: (chip: string) => TallyChoice | null,
  previous: TallyUndo | null
): TallyStep | null {
  const undo = (climb: ClimbDraft): TallyUndo => {
    const grade = tallyGradeOf(climb);
    return {
      id: (previous?.id ?? 0) + 1,
      message: go === "fell" ? t("tally.fellOn", { grade }) : t("tally.sentGrade", { grade }),
      draft,
      selection,
    };
  };
  if (selection?.kind === "pending") {
    const choice = choiceOf(selection.chip);
    if (choice === null) return null;
    const next = newTallyClimb(draft, choice, go);
    const climb = next.draft.climbs.find((c) => c.key === next.key);
    if (climb === undefined) return null;
    return {
      draft: withExerciseClimb(next.draft, next.key),
      selection: go === "fell" ? { kind: "row", key: next.key } : null,
      undo: undo(climb),
    };
  }
  if (selection?.kind !== "row") return null;
  const climb = draft.climbs.find((c) => c.key === selection.key);
  if (climb === undefined) return null;
  return {
    draft: {
      ...draft,
      climbs: draft.climbs.map((c) => (c.key === selection.key ? withTallyGo(c, go) : c)),
    },
    selection: go === "sent" ? null : selection,
    undo: undo(climb),
  };
}

/** "1h 20m · 6 sent · top V5" on the finish sheet. */
export function finishSummary(draft: LogSessionDraft, minutes: number): string {
  const sends = draft.climbs.filter((c) => c.kind === "send");
  const top = [...sends].sort(
    (a, b) => (vGradeOf(b.grade, b.scale) ?? -1) - (vGradeOf(a.grade, a.scale) ?? -1)
  )[0];
  return [
    durationLabel(minutes),
    t("tally.sentCount", { count: sends.length }),
    ...(top === undefined ? [] : [t("sessions.topSend", { grade: tallyGradeOf(top) })]),
  ].join(" · ");
}
