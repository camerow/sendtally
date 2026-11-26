import React from "react";
import { Pressable, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { Button } from "../components/Button";

export type ExerciseBlockProps = {
  /** Its `ExerciseHead`, or a superset's head and member list. */
  head: React.ReactNode;
  children?: React.ReactNode;
  /** Add set or Add round, under its rows. */
  add?: { label: string; accessibilityLabel?: string; onPress: () => void };
  /** The card's timer, beside Add set and filling the rest of its line. */
  action?: { label: string; onPress: () => void };
  /** A press on the block outside its controls, such as a climbing card taking the grade picker. */
  onPress?: () => void;
};

/** One exercise, or one superset, on every screen and for every kind: a frame, a head, its rows. */
export function ExerciseBlock({
  head,
  children,
  add,
  action,
  onPress,
}: ExerciseBlockProps): React.ReactElement {
  return (
    <Pressable
      accessible={false}
      disabled={onPress === undefined}
      onPress={onPress}
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
        <View style={{ flexDirection: "row", gap: 8, paddingTop: action === undefined ? 6 : 8 }}>
          <Button
            label={add.label}
            {...(add.accessibilityLabel !== undefined && {
              accessibilityLabel: add.accessibilityLabel,
            })}
            onPress={add.onPress}
            variant="outline"
            icon="plus"
            height={action === undefined ? 40 : 48}
          />
          {action !== undefined && (
            <Button
              label={action.label}
              onPress={action.onPress}
              variant="primary"
              icon="play"
              height={48}
              style={{ flex: 1 }}
            />
          )}
        </View>
      )}
    </Pressable>
  );
}
