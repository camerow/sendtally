import React from "react";
import { Pressable, Text } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { press } from "../../../lib/press";
import { type } from "../type";
import { NumberField, type NumberFieldProps } from "./NumberField";

export type StepperProps = Omit<NumberFieldProps, "before" | "after"> & {
  onStep: (direction: 1 | -1) => void;
  decreaseLabel: string;
  increaseLabel: string;
  /** "card" sits on a soft panel, so its buttons are white; "plain" sits on white. */
  surface: "card" | "plain";
};

/** − / number box / + under the box's label, for a number stepped more often than typed. */
export function Stepper({
  onStep,
  decreaseLabel,
  increaseLabel,
  surface,
  ...field
}: StepperProps): React.ReactElement {
  const step = (direction: 1 | -1, a11y: string, glyph: string): React.ReactElement => (
    <Pressable
      onPress={() => onStep(direction)}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      style={press({
        width: 46,
        height: 46,
        borderRadius: 23,
        borderWidth: 1,
        borderColor: colors.lineOnLightStrong,
        backgroundColor: surface === "card" ? colors.white : undefined,
        alignItems: "center",
        justifyContent: "center",
      })}
    >
      <Text style={[type.bodyBold, { fontSize: 20, color: colors.gunmetal }]}>{glyph}</Text>
    </Pressable>
  );
  return (
    <NumberField
      {...field}
      before={step(-1, decreaseLabel, "−")}
      after={step(1, increaseLabel, "+")}
    />
  );
}
