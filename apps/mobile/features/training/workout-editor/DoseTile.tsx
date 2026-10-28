import React from "react";
import { View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { Label } from "../components/Label";
import { NumberField } from "../components/NumberField";

export type DoseTileProps = {
  label: string;
  value: string;
  keyboard: "number-pad" | "numbers-and-punctuation" | "decimal-pad";
  onCommit: (text: string) => void;
  /** What an empty field reads as. */
  placeholder?: string;
  /** What a screen reader calls it, when the label alone is not enough. */
  accessibilityLabel?: string;
};

/** One dose number on a soft tile: its label over what is typed. */
export function DoseTile({
  label,
  value,
  keyboard,
  onCommit,
  placeholder = "–",
  accessibilityLabel = label,
}: DoseTileProps): React.ReactElement {
  return (
    <View
      style={{
        flexGrow: 1,
        flexBasis: "30%",
        minHeight: 52,
        justifyContent: "center",
        paddingHorizontal: 10,
        paddingTop: 6,
        borderRadius: 10,
        backgroundColor: colors.surfaceSoft,
      }}
    >
      <Label small color={colors.textSecondary}>
        {label}
      </Label>
      <NumberField
        value={value}
        onCommit={onCommit}
        label={accessibilityLabel}
        placeholder={placeholder}
        keyboard={keyboard}
        style={{
          textAlign: "left",
          paddingHorizontal: 0,
          height: 30,
          fontSize: 15,
          color: colors.gunmetal,
        }}
      />
    </View>
  );
}
