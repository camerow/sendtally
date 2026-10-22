import React from "react";
import { Pressable, Text, View, type KeyboardTypeOptions } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { press } from "../../../lib/press";
import { type } from "../type";
import { NumberField } from "./NumberField";

export type StepperProps = {
  value: string;
  onCommit: (text: string) => void;
  onStep: (direction: 1 | -1) => void;
  label: string;
  decreaseLabel: string;
  increaseLabel: string;
  /** "card" sits on a soft panel, so its controls are white; "plain" sits on white. */
  surface: "card" | "plain";
  buttonSize?: number;
  inputWidth?: number;
  fontSize?: number;
  keyboard?: KeyboardTypeOptions;
  inSheet?: boolean;
};

/** − / typed number / +. Buttons apply at once; typing commits on blur or return. */
export function Stepper({
  value,
  onCommit,
  onStep,
  label,
  decreaseLabel,
  increaseLabel,
  surface,
  buttonSize = 44,
  inputWidth,
  fontSize = 17,
  keyboard,
  inSheet,
}: StepperProps): React.ReactElement {
  const fill = surface === "card" ? colors.white : colors.surfaceSoft;
  const step = (direction: 1 | -1, a11y: string, glyph: string): React.ReactElement => (
    <Pressable
      onPress={() => onStep(direction)}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      style={press({
        width: buttonSize,
        height: buttonSize,
        borderRadius: buttonSize / 2,
        borderWidth: 1,
        borderColor: colors.lineOnLightStrong,
        backgroundColor: surface === "card" ? colors.white : undefined,
        alignItems: "center",
        justifyContent: "center",
      })}
    >
      <Text
        style={[type.bodyBold, { fontSize: buttonSize >= 48 ? 22 : 20, color: colors.gunmetal }]}
      >
        {glyph}
      </Text>
    </Pressable>
  );
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      {step(-1, decreaseLabel, "−")}
      <NumberField
        value={value}
        onCommit={onCommit}
        label={label}
        keyboard={keyboard}
        inSheet={inSheet}
        style={{
          width: inputWidth,
          flex: inputWidth === undefined ? 1 : undefined,
          minWidth: 0,
          height: buttonSize,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.lineOnLightStrong,
          backgroundColor: fill,
          color: colors.gunmetal,
          fontSize,
        }}
      />
      {step(1, increaseLabel, "+")}
    </View>
  );
}
