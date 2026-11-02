import React from "react";
import { Pressable, Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { pressRow } from "../../../lib/press";
import { CheckBox } from "../components/CheckBox";
import { type } from "../type";

export type ChecklistRowProps = {
  name: string;
  dose: string;
  ticked: boolean;
  /** ▶ on the right, for a timed line. */
  go?: React.ReactNode;
  onToggle: () => void;
};

/**
 * One line of a routine, its name over its dose: the whole row ticks it, and a ticked one reads
 * as struck through.
 */
export function ChecklistRow({
  name,
  dose,
  ticked,
  go,
  onToggle,
}: ChecklistRowProps): React.ReactElement {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        borderBottomWidth: 1,
        borderBottomColor: colors.lineOnLight,
      }}
    >
      <Pressable
        onPress={onToggle}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: ticked }}
        accessibilityLabel={`${name}, ${dose}`}
        style={pressRow({
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          gap: 14,
          minHeight: 60,
        })}
      >
        <CheckBox checked={ticked} color={colors.gunmetal} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text
            style={[
              type.bodyBold,
              {
                fontSize: 16,
                color: ticked ? colors.textSecondary : colors.gunmetal,
                textDecorationLine: ticked ? "line-through" : "none",
              },
            ]}
          >
            {name}
          </Text>
          <Text style={[type.mono, { fontSize: 12.5, color: colors.textSecondary }]}>{dose}</Text>
        </View>
      </Pressable>
      {go}
    </View>
  );
}
