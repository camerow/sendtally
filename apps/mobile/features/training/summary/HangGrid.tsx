import React from "react";
import { Text, View } from "react-native";
import type { WeightUnit } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { type } from "../type";
import { EffortMark } from "../components/EffortMark";
import { hangLoadText as loadText } from "@sendtally/features/activities";

export type HangGridProps = {
  /** Each set's hangs, held or not, filling from the left. */
  rows: readonly (readonly boolean[])[];
  /** Each set's load, at the end of its row. */
  loads: readonly number[];
  /** Each set's RPE where rated; the column shows once one set has one. */
  rpes: readonly (number | undefined)[];
  unit: WeightUnit;
};

/** A hangboard session's hangs, set by set: every cell the same box, held ones green, then the load. */
export function HangGrid({ rows, loads, rpes, unit }: HangGridProps): React.ReactElement {
  const held = rows.flat().filter(Boolean).length;
  const rated = rpes.some((r) => r !== undefined);
  return (
    <View accessible accessibilityLabel={t("summary.hangsOf", { held, total: rows.flat().length })}>
      {rows.map((row, s) => {
        const load = loads[s] ?? 0;
        return (
          <View key={s} style={{ flexDirection: "row", alignItems: "center", gap: 6, height: 30 }}>
            <Text style={[type.mono, { width: 52, fontSize: 14, color: colors.textSecondary }]}>
              {t("summary.setN", { n: s + 1 })}
            </Text>
            {row.map((done, r) => (
              <View
                key={r}
                style={{
                  flex: 1,
                  height: 24,
                  borderRadius: 7,
                  borderWidth: 2,
                  borderColor: done ? colors.fern : "rgba(64,63,76,0.26)",
                  backgroundColor: done ? colors.fern : colors.white,
                }}
              />
            ))}
            <Text
              style={[
                load === 0 ? type.mono : type.monoBold,
                {
                  width: 54,
                  fontSize: 13,
                  textAlign: "right",
                  color: load === 0 ? colors.textSecondary : colors.gunmetal,
                },
              ]}
            >
              {loadText(load, unit)}
            </Text>
            {rated && (
              <View style={{ width: 58, alignItems: "flex-end" }}>
                {rpes[s] !== undefined && <EffortMark rpe={rpes[s]} />}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}
