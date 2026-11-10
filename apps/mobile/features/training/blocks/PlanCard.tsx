import React from "react";
import { Pressable, Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { Icon } from "../../../components/Icon";
import { pressRow } from "../../../lib/press";
import { Title } from "../components/Title";
import { type } from "../type";

export type PlanCardProps = {
  title: string;
  /** Under the title: a block's dates, or what the plans in no block do. */
  subtitle?: string;
  /** Makes the title a button. */
  open?: { label: string; onPress: () => void };
  children: React.ReactNode;
};

/** A framed set of plans under a title: a block, or the plans in no block. */
export function PlanCard({ title, subtitle, open, children }: PlanCardProps): React.ReactElement {
  const head = (
    <>
      <Title size={20}>{title}</Title>
      {subtitle !== undefined && (
        <Text style={[type.mono, { fontSize: 12, color: colors.textSecondary }]}>{subtitle}</Text>
      )}
    </>
  );
  return (
    <View
      style={{
        gap: 14,
        padding: 18,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: colors.lineOnLightStrong,
      }}
    >
      {open === undefined ? (
        <View style={{ gap: 4 }}>{head}</View>
      ) : (
        <Pressable
          onPress={open.onPress}
          accessibilityRole="button"
          accessibilityLabel={open.label}
          style={pressRow({ flexDirection: "row", alignItems: "center", gap: 12 })}
        >
          <View style={{ flex: 1, gap: 4 }}>{head}</View>
          <Icon name="chevron" size={14} strokeWidth={2} color="rgba(64,63,76,0.45)" />
        </Pressable>
      )}
      {children}
    </View>
  );
}
