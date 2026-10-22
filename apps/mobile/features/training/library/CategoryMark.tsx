import React from "react";
import { View } from "react-native";
import type { WorkoutCategory } from "@sendtally/features/workouts";
import { DayMark } from "../today/DayMark";
import { KIND_LOOK } from "../today/kindLook";

export type CategoryMarkProps = { category: WorkoutCategory; size?: number };

/** A category's mark on its tint, the way it shows wherever a workout or plan is picked. */
export function CategoryMark({ category, size = 36 }: CategoryMarkProps): React.ReactElement {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: KIND_LOOK[category].tint,
      }}
    >
      <DayMark kind={category} filled scale={size / 24} />
    </View>
  );
}
