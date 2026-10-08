import React from "react";
import { Pressable, Text, View } from "react-native";
import type { DayState } from "@sendtally/core/hang";
import { Label } from "../../components/Label";
import { useTheme } from "../../theme/ThemeContext";
import { type } from "../../theme/type";

export type DayCellProps = {
  letter: string;
  day: number;
  state: DayState;
  isToday: boolean;
  isFuture: boolean;
  selected: boolean;
  label: string;
  onPress: () => void;
};

export function DayCell({
  letter,
  day,
  state,
  isToday,
  isFuture,
  selected,
  label,
  onPress,
}: DayCellProps): React.ReactElement {
  const c = useTheme();
  const ring = state.trained
    ? { backgroundColor: c.accent, borderColor: c.accent, borderWidth: 1.5 }
    : isToday
      ? { borderColor: c.accent, borderWidth: 2 }
      : state.planned && isFuture
        ? { borderColor: c.accent, borderWidth: 1.5, borderStyle: "dashed" as const }
        : { borderColor: c.lineDark, borderWidth: 1.5 };
  const ink = state.trained ? c.ground : state.planned && isFuture ? c.onDark : c.onDark3;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      style={{
        width: 48,
        paddingTop: 6,
        paddingBottom: 8,
        borderRadius: 14,
        alignItems: "center",
        gap: 6,
        backgroundColor: selected ? c.ground : undefined,
        borderWidth: selected ? 1.5 : 0,
        borderColor: c.onDark3,
      }}
    >
      <Label color={isToday ? c.accent : c.onDark3}>{letter}</Label>
      <View
        style={[
          {
            width: 36,
            height: 36,
            borderRadius: 18,
            alignItems: "center",
            justifyContent: "center",
          },
          ring,
        ]}
      >
        <Text style={[type.monoBold, { fontSize: 14, color: ink }]}>{day}</Text>
      </View>
      <View
        style={{
          width: 5,
          height: 5,
          borderRadius: 3,
          backgroundColor: state.missed ? c.rest : "transparent",
        }}
      />
    </Pressable>
  );
}
