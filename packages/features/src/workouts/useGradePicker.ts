import React from "react";
import type { SetClimb } from "@sendtally/core/hang";
import type { ClimbSummary, GradeScales } from "@sendtally/api-client";
import { t } from "../i18n";
import { typicalGradeIndex } from "../climbs/transforms";
import { gradeOptions } from "../log-session/transforms";
import { disciplineLabel, type Discipline } from "../log-session/types";
import type { Tally } from "../log-session/useTally";

/** What a grade picker shows and does, whether it adds to the run's tally or to a logged set. */
export type GradePickerModel = Pick<
  Tally,
  "segments" | "segment" | "segmentLabel" | "pickSegment" | "chips" | "startIndex" | "add"
>;

/**
 * Boulder or Route grades in the climber's scales, opening at their typical grade as the run's
 * picker does; a grade picked adds a climb at it, one attempt, not sent.
 */
export function useGradePicker(
  scales: GradeScales,
  climbs: readonly ClimbSummary[],
  onAdd: (climb: SetClimb) => void
): GradePickerModel {
  const [discipline, setDiscipline] = React.useState<Discipline>("boulder");
  const scale = scales[discipline];
  return {
    segments: ["boulder", "route"],
    segment: discipline,
    segmentLabel: (s) => (s === "circuit" ? t("gyms.circuit") : disciplineLabel(s)),
    pickSegment: (s) => {
      if (s !== "circuit") setDiscipline(s);
    },
    chips: gradeOptions(scale).map((g) => ({ key: g, label: g })),
    startIndex: typicalGradeIndex([...climbs], scale),
    add: (grade) => onAdd({ grade, scale, tries: 1, sent: false }),
  };
}
