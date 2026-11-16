import React from "react";
import { Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { TimeField } from "../../../components/TimeField";
import { DashedRule } from "../components/DashedRule";
import { type } from "../type";

export type GapRestProps = {
  /** The exercise it rests after, as the user reads it. */
  after: string;
  seconds: number;
  onChange: (seconds: number) => void;
};

/** The rest between two exercise cards, where it falls, typed on the keypad. */
export function GapRest({ after, seconds, onChange }: GapRestProps): React.ReactElement {
  const label = t("workouts.restAfter", { name: after });
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginVertical: -6 }}>
      <DashedRule />
      <Text style={[type.mono, { fontSize: 12, color: colors.textMuted }]}>{t("hang.rest")}</Text>
      <TimeField
        compact
        label={label}
        accessibilityLabel={label}
        value={seconds}
        max={3600}
        onChange={onChange}
      />
      <DashedRule />
    </View>
  );
}
