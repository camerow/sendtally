import React from "react";
import type { SetClimb } from "@sendtally/core/hang";
import { climbLine } from "@sendtally/features/activities";
import { useDisplayScales } from "@sendtally/features/settings";
import { SetRow } from "../components/SetRow";
import { ClimbGrade, climbGradeText } from "./ClimbGrade";

export type ClimbReadRowProps = { position: number; climb: SetClimb };

/** One climb as done: its grade, then "2 attempts · sent". */
export function ClimbReadRow({ position, climb }: ClimbReadRowProps): React.ReactElement {
  const scales = useDisplayScales();
  const line = climbLine(climb);
  return (
    <SetRow
      mode="read"
      position={String(position)}
      {...(climb.name === undefined ? {} : { name: climb.name })}
      label={`${climbGradeText(climb, scales)}, ${line}`}
    >
      <ClimbGrade climb={climb} scales={scales} />
      <span className="climb-line">{line}</span>
    </SetRow>
  );
}
