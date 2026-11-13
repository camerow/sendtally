import React from "react";
import { View } from "react-native";
import Animated, { ZoomIn } from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import type { RepMark } from "@sendtally/core/hang";
import { HANG_ON_DARK, ON_DARK_MUTED, ON_DARK_TRACK } from "@sendtally/features/workouts";

export type RepDotsProps = { reps: number; marks: readonly RepMark[]; working: boolean };

/** One dot per rep in the set: done filled, missed a cross, current ringed. */
export function RepDots({ reps, marks, working }: RepDotsProps): React.ReactElement {
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
              style={[dot, { backgroundColor: HANG_ON_DARK }]}
            />
          );
        if (mark === "miss")
          return (
            <Svg key={i} width={14} height={14} viewBox="0 0 14 14">
              <Path
                d="M3.5 3.5l7 7M10.5 3.5l-7 7"
                stroke={ON_DARK_MUTED}
                strokeWidth={2}
                strokeLinecap="round"
              />
            </Svg>
          );
        const current = working && i === marks.length;
        return (
          <View
            key={i}
            style={[
              dot,
              current
                ? { borderWidth: 2, borderColor: HANG_ON_DARK }
                : { backgroundColor: ON_DARK_TRACK },
            ]}
          />
        );
      })}
    </View>
  );
}
