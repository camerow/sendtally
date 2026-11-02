import React from "react";
import { Pressable, Text } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { type } from "../type";
import { HangIcon } from "./HangIcon";

export type DateFieldProps = { text: string; open: boolean; onToggle: () => void; label: string };

export function DateField({ text, open, onToggle, label }: DateFieldProps): React.ReactElement {
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${text}`}
      accessibilityState={{ expanded: open }}
      style={{
        height: 50,
        paddingHorizontal: 14,
        borderRadius: 12,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: colors.surfaceSoft,
        borderWidth: open ? 2 : 0,
        borderColor: colors.gunmetal,
      }}
    >
      <Text style={[type.bodyBold, { fontSize: 15, color: colors.gunmetal }]}>{text}</Text>
      <HangIcon name="schedule" color={colors.gunmetal} size={20} strokeWidth={1.8} />
    </Pressable>
  );
}
