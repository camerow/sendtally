import React from "react";
import { Text, View, type StyleProp, type ViewStyle } from "react-native";
import { ON_DARK, ON_DARK_SOFT } from "@sendtally/features/workouts";
import { type } from "../type";

export type TimerColumnProps = {
  /** "Half crimp · 20 mm": the grip and the edge. */
  grip: string;
  ring: React.ReactNode;
  setLine: string;
  dots: React.ReactNode;
  /** Under the grip line, such as the load stepper. */
  children?: React.ReactNode;
  /** Between the grip line, the ring and the set line. */
  gap?: number;
  style?: StyleProp<ViewStyle>;
};

/** The hang timer's middle: the grip line, the ring, then the set line over the rep dots. */
export function TimerColumn({
  grip,
  ring,
  setLine,
  dots,
  children,
  gap = 24,
  style,
}: TimerColumnProps): React.ReactElement {
  return (
    <View style={[{ alignItems: "center", justifyContent: "center", gap }, style]}>
      <View style={{ alignItems: "center", gap: 8 }}>
        <Text style={[type.mono, { fontSize: 13, color: ON_DARK_SOFT }]}>{grip}</Text>
        {children}
      </View>
      {ring}
      <View style={{ alignItems: "center", gap: 10 }}>
        <Text style={[type.monoBold, { fontSize: 15, color: ON_DARK }]}>{setLine}</Text>
        {dots}
      </View>
    </View>
  );
}
