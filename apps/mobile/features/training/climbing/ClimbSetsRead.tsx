import React from "react";
import { Text, View } from "react-native";
import type { SetClimb, SetDone } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { CIRCUIT_COLOURS, CIRCUIT_HEX } from "@sendtally/features/gyms";
import { t } from "@sendtally/features/i18n";
import { draftGrade } from "@sendtally/features/log-session";
import { displayGrade, type GradeScales } from "@sendtally/features/sessions";
import { useDisplayScales } from "@sendtally/features/settings";
import { Label } from "../components/Label";
import { SetRow } from "../sets/SetRow";
import { type } from "../type";

export type ClimbSetsReadProps = { sets: readonly SetDone[] };

const gradeOf = (climb: SetClimb, scales: GradeScales): string => {
  if (climb.circuit !== undefined) return climb.circuit.label;
  const grade = draftGrade(climb.grade, climb.scale);
  return grade === undefined ? climb.grade : displayGrade(grade, scales);
};

const lineOf = (climb: SetClimb): string =>
  [
    t("logSession.attemptCount", { count: climb.tries }),
    ...(climb.sent ? [t("summary.sent")] : []),
  ].join(" · ");

/** A climbing exercise's sets as done: each set's climbs as read rows, grade then how it went. */
export function ClimbSetsRead({ sets }: ClimbSetsReadProps): React.ReactElement {
  const scales = useDisplayScales();
  return (
    <>
      {sets.map((set, s) => (
        <View key={s}>
          <Label small color={colors.textSecondary} style={{ paddingTop: s === 0 ? 2 : 8 }}>
            {t("tally.setLabel", { set: s + 1 })}
          </Label>
          {(set.climbs ?? []).map((climb, c) => {
            const colour = CIRCUIT_COLOURS.find((x) => x === climb.circuit?.colour);
            const grade = gradeOf(climb, scales);
            const line = lineOf(climb);
            return (
              <SetRow
                key={c}
                mode="read"
                position={String(c + 1)}
                {...(climb.name === undefined ? {} : { name: climb.name })}
                label={`${grade}, ${line}`}
              >
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
                    {grade}
                  </Text>
                </View>
                <Text style={[type.monoBold, { flex: 1, fontSize: 14, color: colors.gunmetal }]}>
                  {line}
                </Text>
              </SetRow>
            );
          })}
        </View>
      ))}
    </>
  );
}
