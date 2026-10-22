import React from "react";
import { Pressable, Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { Label } from "../components/Label";
import { ON_DARK, ON_DARK_MUTED, ON_DARK_SOFT } from "../components/onDark";
import { type } from "../type";
import type { StepText } from "./intervalsText";

export type StepCardProps = {
  text: StepText;
  color: string;
  accessibilityLabel: string;
  onPress: () => void;
};

/** The step playing now, big: its kind and side, name, countdown or count, and cue. Tapping it is the primary action. */
export function StepCard({
  text,
  color,
  accessibilityLabel,
  onPress,
}: StepCardProps): React.ReactElement {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => ({
        gap: 10,
        paddingVertical: 26,
        paddingHorizontal: 22,
        borderRadius: 24,
        backgroundColor: colors.gunmetalDeep,
        opacity: pressed ? 0.9 : 1,
      })}
    >
      <Label color={color}>{text.kicker}</Label>
      <Text
        numberOfLines={2}
        style={[type.display, { fontSize: 36, lineHeight: 38, color: ON_DARK }]}
      >
        {text.title}
      </Text>
      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 12 }}>
        <Text
          adjustsFontSizeToFit
          numberOfLines={1}
          style={[type.monoBold, { fontSize: 96, lineHeight: 100, color: ON_DARK }]}
        >
          {text.big}
        </Text>
        {text.of !== null && (
          <Text style={[type.mono, { fontSize: 15, color: ON_DARK_MUTED }]}>{text.of}</Text>
        )}
      </View>
      {text.note !== null && (
        <Text style={[type.body, { fontSize: 14, lineHeight: 20, color: ON_DARK_SOFT }]}>
          {text.note}
        </Text>
      )}
    </Pressable>
  );
}
