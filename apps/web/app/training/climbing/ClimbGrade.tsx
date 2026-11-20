import React from "react";
import type { SetClimb } from "@sendtally/core/hang";
import { CIRCUIT_COLOURS } from "@sendtally/features/gyms";
import { draftGrade } from "@sendtally/features/log-session";
import { displayGrade, type GradeScales } from "@sendtally/features/sessions";
import { CircuitDot } from "../../components/CircuitDot";

export type ClimbGradeProps = {
  climb: Pick<SetClimb, "grade" | "scale" | "circuit">;
  scales: GradeScales;
};

/** "V5" in the climber's scale, or a circuit's label. */
export const climbGradeText = (climb: ClimbGradeProps["climb"], scales: GradeScales): string => {
  if (climb.circuit !== undefined) return climb.circuit.label;
  const grade = draftGrade(climb.grade, climb.scale);
  return grade === undefined ? climb.grade : displayGrade(grade, scales);
};

/** A climb row's grade column: the grade, or a circuit's colour and label. */
export function ClimbGrade({ climb, scales }: ClimbGradeProps): React.ReactElement {
  const colour = CIRCUIT_COLOURS.find((c) => c === climb.circuit?.colour);
  return (
    <span className="climb-grade">
      {colour !== undefined && <CircuitDot colour={colour} size={10} />}
      <span className="climb-grade-text">{climbGradeText(climb, scales)}</span>
    </span>
  );
}
