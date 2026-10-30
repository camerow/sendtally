import React from "react";
import { Text, View } from "react-native";
import type { WeightUnit } from "@sendtally/core/hang";
import { colors, radius } from "@sendtally/design/tokens";
import {
  climbsLine,
  isClimbingSets,
  setChip,
  setText,
  wallLine,
  type ExerciseResult,
} from "@sendtally/features/activities";
import { shortDate } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { Label } from "../components/Label";
import { type } from "../type";
import { ClimbBadge } from "./ClimbBadge";
import { changeText } from "./summaryText";

export type ExerciseResultCardProps = { result: ExerciseResult; unit: WeightUnit };

/**
 * One exercise as done: its sets with the best one dark, and how it moved since last time.
 * Climbs read as a row of grades per set; time on the wall as time and laps per set.
 */
export function ExerciseResultCard({ result, unit }: ExerciseResultCardProps): React.ReactElement {
  const { change, last } = result;
  const climbing = isClimbingSets(result.sets);
  const wall = climbing && result.sets.some((s) => s.onS !== undefined);
  const chips = result.sets
    .map((set, i) => ({ i, text: setChip(set, unit) }))
    .filter((c) => c.text !== "");
  const footer = wall
    ? wallLine(result.sets)
    : climbing
      ? climbsLine(result.sets)
      : last === null
        ? null
        : t("summary.lastTime", { set: setText(last.set, unit), date: shortDate(last.date) });
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
      {climbing && !wall
        ? result.sets.map((set, i) => (
            <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Label small color={colors.textSecondary} style={{ width: 44 }}>
                {t("tally.setLabel", { set: i + 1 })}
              </Label>
              <View style={{ flex: 1, flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                {(set.climbs ?? []).map((climb, c) => (
                  <ClimbBadge key={c} climb={climb} />
                ))}
              </View>
            </View>
          ))
        : chips.length > 0 && (
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
      {footer !== null && (
        <Text style={[type.mono, { fontSize: 11.5, color: colors.textSecondary }]}>{footer}</Text>
      )}
    </View>
  );
}
