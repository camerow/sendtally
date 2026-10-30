import React from "react";
import { Pressable, Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { Icon } from "../../../components/Icon";
import { pressRow } from "../../../lib/press";
import { type } from "../type";

export type LoadSectionProps = {
  name: string;
  /** Its dose, and which weeks change it. */
  summary: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
};

/** One exercise of a workout in its block: its weekly load when open, what changes when closed. */
export function LoadSection({
  name,
  summary,
  open,
  onToggle,
  children,
}: LoadSectionProps): React.ReactElement {
  return (
    <View
      style={{
        paddingHorizontal: 12,
        paddingBottom: open ? 12 : 0,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "rgba(64,63,76,0.14)",
      }}
    >
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        style={pressRow({ minHeight: 52, flexDirection: "row", alignItems: "center", gap: 10 })}
      >
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[type.bodyBold, { fontSize: 15, color: colors.gunmetal }]}>{name}</Text>
          <Text style={[type.mono, { fontSize: 11.5, color: colors.textSecondary }]}>
            {summary}
          </Text>
        </View>
        <View style={{ transform: [{ rotate: open ? "-90deg" : "90deg" }] }}>
          <Icon name="chevron" size={14} strokeWidth={2.2} color={colors.textSecondary} />
        </View>
      </Pressable>
      {open && children}
    </View>
  );
}
