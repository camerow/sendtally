import React from "react";
import { Pressable, Text } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { press } from "../../../lib/press";
import { HangIcon } from "../components/HangIcon";
import { AMBER } from "../components/tints";
import { type } from "../type";

export type SetChipProps = {
  /** The set as it was done, "8 × +10"; empty when it only ticks off. */
  text: string;
  /** How far short of its dose it fell, "4 of 6", when it did. */
  short: string | null;
  on: boolean;
  label: string;
  onToggle: () => void;
};

/** One set under its exercise: ticked, done in part in amber, or off; a tap turns it on or off. */
export function SetChip({ text, short, on, label, onToggle }: SetChipProps): React.ReactElement {
  const partial = on && short !== null;
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: on }}
      accessibilityLabel={label}
      hitSlop={{ top: 7, bottom: 7 }}
      style={press({
        height: 30,
        minWidth: 30,
        paddingHorizontal: 9,
        borderRadius: 8,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 5,
        backgroundColor: on && !partial ? colors.surfaceSoft : colors.white,
        borderWidth: partial ? 1.5 : on ? 0 : 1,
        borderColor: partial ? AMBER : "rgba(64,63,76,0.3)",
      })}
    >
      {on && !partial && <HangIcon name="check" color={colors.fern} size={12} strokeWidth={3} />}
      {(partial || text !== "") && (
        <Text
          style={[
            type.monoBold,
            { fontSize: 12.5, color: on ? colors.gunmetal : colors.textSecondary },
          ]}
        >
          {partial ? short : text}
        </Text>
      )}
    </Pressable>
  );
}
