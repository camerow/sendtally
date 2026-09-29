import React from "react";
import { View } from "react-native";
import Animated, { ZoomIn } from "react-native-reanimated";
import type { RepMark } from "@sendtally/core/hang";
import { useTheme } from "../../theme/ThemeContext";

export type RepDotsProps = { reps: number; marks: readonly RepMark[]; working: boolean };

/** One dot per rep in the set: done filled, missed dashed, current ringed. */
export function RepDots({ reps, marks, working }: RepDotsProps): React.ReactElement {
  const c = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: 8,
        maxWidth: 320,
      }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {Array.from({ length: reps }, (_, i) => {
        const mark = marks[i];
        const dot = { width: 14, height: 14, borderRadius: 7 };
        if (mark === "ok")
          return (
            <Animated.View
              key={i}
              entering={ZoomIn.springify()}
              style={[dot, { backgroundColor: c.accent }]}
            />
          );
        if (mark === "miss")
          return (
            <View
              key={i}
              style={[dot, { borderWidth: 2, borderStyle: "dashed", borderColor: c.rest }]}
            />
          );
        const current = working && i === marks.length;
        return (
          <View
            key={i}
            style={[dot, { borderWidth: 2, borderColor: current ? c.accent : c.lineDark }]}
          />
        );
      })}
    </View>
  );
}
