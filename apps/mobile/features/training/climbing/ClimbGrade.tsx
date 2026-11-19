import React from "react";
import { Text, View } from "react-native";
import type { SetClimb } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { CIRCUIT_COLOURS, CIRCUIT_HEX } from "@sendtally/features/gyms";
import { draftGrade } from "@sendtally/features/log-session";
import { displayGrade, type GradeScales } from "@sendtally/features/sessions";
import { type } from "../type";

export type ClimbGradeProps = {
  climb: Pick<SetClimb, "grade" | "scale" | "circuit">;
  scales: GradeScales;
};

/** "V5" in the climber's scale, or a circuit's colour and label. */
export const climbGradeText = (climb: ClimbGradeProps["climb"], scales: GradeScales): string => {
  if (climb.circuit !== undefined) return climb.circuit.label;
  const grade = draftGrade(climb.grade, climb.scale);
  return grade === undefined ? climb.grade : displayGrade(grade, scales);
};

/** A climb row's grade column. */
export function ClimbGrade({ climb, scales }: ClimbGradeProps): React.ReactElement {
  const colour = CIRCUIT_COLOURS.find((c) => c === climb.circuit?.colour);
  return (
    <View style={{ width: 60, flexDirection: "row", alignItems: "center", gap: 5 }}>
      {colour !== undefined && (
        <View
          style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: CIRCUIT_HEX[colour],
            borderWidth: 1,
            borderColor: colors.lineOnLightStrong,
          }}
        />
      )}
      <Text
        numberOfLines={1}
        style={[type.monoBold, { flexShrink: 1, fontSize: 14, color: colors.gunmetal }]}
      >
        {climbGradeText(climb, scales)}
      </Text>
    </View>
  );
}
