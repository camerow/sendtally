import React from "react";
import { View } from "react-native";
import type { WorkoutKind } from "@sendtally/core/hang";
import { DayMark } from "../today/DayMark";
import { KIND_LOOK } from "../today/kindLook";

export type CategoryMarkProps = { kind: WorkoutKind; size?: number };

/** A kind's mark on its tint, the way it shows wherever a workout or plan is picked. */
export function CategoryMark({ kind, size = 36 }: CategoryMarkProps): React.ReactElement {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: KIND_LOOK[kind].tint,
      }}
    >
      <DayMark kind={kind} filled scale={size / 24} />
    </View>
  );
}
