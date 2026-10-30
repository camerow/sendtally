import React from "react";
import { Pressable, Text } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { pressRow } from "../../../lib/press";
import { CheckBox } from "../components/CheckBox";
import { type } from "../type";

export type ChecklistRowProps = {
  name: string;
  dose: string;
  ticked: boolean;
  onToggle: () => void;
};

/** One line of a routine: the whole row ticks it, and a ticked one reads as struck through. */
export function ChecklistRow({
  name,
  dose,
  ticked,
  onToggle,
}: ChecklistRowProps): React.ReactElement {
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: ticked }}
      accessibilityLabel={`${name}, ${dose}`}
      style={pressRow({
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        minHeight: 60,
        borderBottomWidth: 1,
        borderBottomColor: colors.lineOnLight,
      })}
    >
      <CheckBox checked={ticked} color={colors.gunmetal} />
      <Text
        style={[
          type.body,
          {
            flex: 1,
            fontSize: 16,
            color: ticked ? colors.textSecondary : colors.gunmetal,
            textDecorationLine: ticked ? "line-through" : "none",
          },
        ]}
      >
        {name}
      </Text>
      <Text style={[type.mono, { fontSize: 13, color: colors.textSecondary }]}>{dose}</Text>
    </Pressable>
  );
}
