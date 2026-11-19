import React from "react";
import { Pressable, Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { ON_DARK, ON_DARK_LINE } from "@sendtally/features/workouts";
import { press } from "../../../lib/press";
import { type } from "../type";
import { NumberField, type NumberFieldProps } from "./NumberField";

export type StepperProps = {
  onStep: (direction: 1 | -1) => void;
  decreaseLabel: string;
  increaseLabel: string;
  /** "card" sits on a soft panel, so its buttons are white; "plain" sits on white; "dark" on a timer. */
  surface: "card" | "plain" | "dark";
} & (
  | (Omit<NumberFieldProps, "before" | "after"> & { text?: undefined })
  /** Read as plain text between − and +, with no box to type in. */
  | { text: string; label: string }
);

/** − / number box / + under the box's label, for a number stepped more often than typed; compact, the buttons match the box. */
export function Stepper({
  onStep,
  decreaseLabel,
  increaseLabel,
  surface,
  ...field
}: StepperProps): React.ReactElement {
  const ink = surface === "dark" ? ON_DARK : colors.gunmetal;
  const size = "compact" in field && field.compact === true ? 36 : 46;
  const step = (direction: 1 | -1, a11y: string, glyph: string): React.ReactElement => (
    <Pressable
      onPress={() => onStep(direction)}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      style={press({
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 1,
        borderColor: surface === "dark" ? ON_DARK_LINE : colors.lineOnLightStrong,
        backgroundColor: surface === "card" ? colors.white : undefined,
        alignItems: "center",
        justifyContent: "center",
      })}
    >
      <Text style={[type.bodyBold, { fontSize: 20, color: ink }]}>{glyph}</Text>
    </Pressable>
  );
  if (field.text !== undefined)
    return (
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        {step(-1, decreaseLabel, "−")}
        <Text
          accessibilityLabel={field.label}
          accessibilityValue={{ text: field.text }}
          style={[type.monoBold, { minWidth: 76, fontSize: 17, textAlign: "center", color: ink }]}
        >
          {field.text}
        </Text>
        {step(1, increaseLabel, "+")}
      </View>
    );
  return (
    <NumberField
      {...field}
      before={step(-1, decreaseLabel, "−")}
      after={step(1, increaseLabel, "+")}
    />
  );
}
