import React from "react";
import { Pressable, Text } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { elapsedClock } from "@sendtally/features/sessions";
import { press } from "../../../lib/press";
import { HangIcon } from "../components/HangIcon";
import { type } from "../type";

export type HoldButtonProps = { name: string; targetS: number; onPress: () => void };

/** ▶ and the target: runs a timed set or line in its own row. */
export function HoldButton({ name, targetS, onPress }: HoldButtonProps): React.ReactElement {
  const time = elapsedClock(targetS);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t("activities.holdStart", { name, time })}
      hitSlop={4}
      style={press({
        height: 36,
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingLeft: 10,
        paddingRight: 12,
        borderRadius: 18,
        borderWidth: 1.5,
        borderColor: colors.fern,
      })}
    >
      <HangIcon name="play" color={colors.fern} size={14} />
      <Text style={[type.monoBold, { fontSize: 14, color: colors.fern }]}>{time}</Text>
    </Pressable>
  );
}
