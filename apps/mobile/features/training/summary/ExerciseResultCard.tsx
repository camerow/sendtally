import React from "react";
import { Text, View } from "react-native";
import type { WeightUnit } from "@sendtally/core/hang";
import { colors, radius } from "@sendtally/design/tokens";
import { setChip, setText, type ExerciseResult } from "@sendtally/features/activities";
import { shortDate } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { type } from "../type";
import { changeText } from "./summaryText";

export type ExerciseResultCardProps = { result: ExerciseResult; unit: WeightUnit };

/** One exercise as done: its sets with the best one dark, and how it moved since last time. */
export function ExerciseResultCard({ result, unit }: ExerciseResultCardProps): React.ReactElement {
  const { change, last } = result;
  const chips = result.sets
    .map((set, i) => ({ i, text: setChip(set, unit) }))
    .filter((c) => c.text !== "");
  return (
    <View
      style={{
        gap: 8,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: radius.card,
        borderWidth: 1,
        borderColor: colors.lineOnLightStrong,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 10 }}>
        <Text style={[type.bodyBold, { flex: 1, fontSize: 15.5, color: colors.gunmetal }]}>
          {result.exercise}
        </Text>
        {change !== null && (
          <Text
            style={[
              type.monoBold,
              { fontSize: 11.5, color: change.by === 0 ? colors.textSecondary : colors.fern },
            ]}
          >
            {changeText(change, unit)}
          </Text>
        )}
      </View>
      {chips.length > 0 && (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
          {chips.map(({ i, text }) => {
            const best = i === result.best;
            return (
              <Text
                key={i}
                style={[
                  type.monoBold,
                  {
                    fontSize: 12.5,
                    lineHeight: 28,
                    paddingHorizontal: 9,
                    borderRadius: 8,
                    overflow: "hidden",
                    color: best ? colors.white : colors.gunmetal,
                    backgroundColor: best ? colors.gunmetal : colors.surfaceSoft,
                  },
                ]}
              >
                {text}
              </Text>
            );
          })}
        </View>
      )}
      {last !== null && (
        <Text style={[type.mono, { fontSize: 11.5, color: colors.textSecondary }]}>
          {t("summary.lastTime", { set: setText(last.set, unit), date: shortDate(last.date) })}
        </Text>
      )}
    </View>
  );
}
