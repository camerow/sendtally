import React from "react";
import { Pressable, Text, View, type KeyboardTypeOptions } from "react-native";
import { press } from "../lib/press";
import { useTheme } from "../theme/ThemeContext";
import type { Theme } from "../theme/themes";
import { type } from "../theme/type";
import { NumberField } from "./NumberField";

export type StepperSurface = "dark" | "light" | "card";

export type StepperProps = {
  value: string;
  onCommit: (text: string) => void;
  onStep: (direction: 1 | -1) => void;
  label: string;
  decreaseLabel: string;
  increaseLabel: string;
  surface: StepperSurface;
  buttonSize?: number;
  inputWidth?: number;
  fontSize?: number;
  keyboard?: KeyboardTypeOptions;
  inSheet?: boolean;
};

function colours(surface: StepperSurface, c: Theme): { fill: string; line: string; ink: string } {
  if (surface === "dark") return { fill: c.deep, line: c.lineDark, ink: c.onDark };
  if (surface === "card") return { fill: c.card, line: c.lineLight, ink: c.ink };
  return { fill: c.soft, line: c.lineLight, ink: c.ink };
}

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
  const c = useTheme();
  const s = colours(surface, c);
  const step = (direction: 1 | -1, a11y: string, glyph: string): React.ReactElement => (
    <Pressable
      onPress={() => onStep(direction)}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      style={press({
        width: buttonSize,
        height: buttonSize,
        borderRadius: buttonSize >= 44 ? 12 : 10,
        borderWidth: 1,
        borderColor: s.line,
        backgroundColor: surface === "card" ? c.card : undefined,
        alignItems: "center",
        justifyContent: "center",
      })}
    >
      <Text style={[type.bodyBold, { fontSize: buttonSize >= 48 ? 22 : 20, color: s.ink }]}>
        {glyph}
      </Text>
    </Pressable>
  );
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
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
          borderRadius: 10,
          borderWidth: 1,
          borderColor: s.line,
          backgroundColor: s.fill,
          color: s.ink,
          fontSize,
        }}
      />
      {step(1, increaseLabel, "+")}
    </View>
  );
}
