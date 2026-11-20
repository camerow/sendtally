import React from "react";
import { View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { Button } from "../components/Button";

export type ExerciseBlockProps = {
  /** Its `ExerciseHead`, or a superset's head and member list. */
  head: React.ReactNode;
  children?: React.ReactNode;
  /** Add set or Add round, under its rows. */
  add?: { label: string; accessibilityLabel?: string; onPress: () => void };
};

/** One exercise, or one superset, on every screen and for every kind: a frame, a head, its rows. */
export function ExerciseBlock({ head, children, add }: ExerciseBlockProps): React.ReactElement {
  return (
    <View
      style={{
        gap: 4,
        padding: 14,
        paddingTop: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.lineOnLightStrong,
      }}
    >
      {head}
      {children}
      {add !== undefined && (
        <View style={{ flexDirection: "row", paddingTop: 6 }}>
          <Button
            label={add.label}
            {...(add.accessibilityLabel !== undefined && {
              accessibilityLabel: add.accessibilityLabel,
            })}
            onPress={add.onPress}
            variant="outline"
            icon="plus"
            height={40}
          />
        </View>
      )}
    </View>
  );
}
