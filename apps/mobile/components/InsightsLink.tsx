import React from "react";
import { Pressable, Text } from "react-native";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { press } from "../lib/press";
import { Icon } from "./Icon";

export type InsightsLinkProps = { title: string; onPress: () => void };

/** A dark row into an insights screen: its title and nothing else. */
export function InsightsLink({ title, onPress }: InsightsLinkProps): React.ReactElement {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={press({
        minHeight: 56,
        marginHorizontal: 18,
        marginBottom: 8,
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        paddingHorizontal: 16,
        borderRadius: radius.panel,
        backgroundColor: colors.gunmetal,
      })}
    >
      <Icon name="insights" color={colors.gold} size={20} strokeWidth={2.4} />
      <Text style={{ flex: 1, fontFamily: fonts.sansSemiBold, fontSize: 16, color: colors.white }}>
        {title}
      </Text>
      <Icon name="chevron" color={colors.white} size={18} strokeWidth={2} />
    </Pressable>
  );
}
