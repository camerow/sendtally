import React from "react";
import { Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { durationLabel } from "@sendtally/features/sessions";
import { Label } from "../components/Label";
import { type } from "../type";

export type HangboardTimingProps = {
  /** Counted from the items; null with none. */
  minutes: number | null;
};

/** The total time a hangboard workout takes, counted from its items and rests. */
export function HangboardTiming({ minutes }: HangboardTimingProps): React.ReactElement {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
      <Label color={colors.textSecondary}>{t("workouts.totalTime")}</Label>
      <Text style={[type.bodyBold, { fontSize: 15, color: colors.gunmetal }]}>
        {minutes === null ? "–" : durationLabel(minutes)}
      </Text>
    </View>
  );
}
