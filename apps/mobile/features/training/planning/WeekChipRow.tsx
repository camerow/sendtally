import React from "react";
import { Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import type { WeekChip } from "@sendtally/features/training";
import { FERN_TINT, GOLD_TINT } from "../components/tints";
import { type } from "../type";

export type WeekChipRowProps = { chips: readonly WeekChip[] };

/** What a week changes, gold for more and green for less, or "As written". */
export function WeekChipRow({ chips }: WeekChipRowProps): React.ReactElement {
  if (chips.length === 0)
    return (
      <Text style={[type.mono, { fontSize: 12, color: colors.textSecondary }]}>
        {t("plan.asWritten")}
      </Text>
    );
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4 }}>
      {chips.map((c, i) => (
        <Text
          key={i}
          style={[
            type.monoBold,
            {
              fontSize: 12,
              paddingHorizontal: 7,
              paddingVertical: 3,
              borderRadius: 6,
              overflow: "hidden",
              color: c.more ? colors.gunmetal : colors.fern,
              backgroundColor: c.more ? GOLD_TINT : FERN_TINT,
            },
          ]}
        >
          {c.text}
        </Text>
      ))}
    </View>
  );
}
