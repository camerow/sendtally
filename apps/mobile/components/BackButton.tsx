import { router } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { t } from "@sendtally/features/i18n";
import { colors, fonts } from "@sendtally/design/tokens";
import { press } from "../lib/press";
import { Icon } from "./Icon";

export function BackButton({ label }: { label?: string }): React.ReactElement {
  return (
    <Pressable
      onPress={() => router.back()}
      accessibilityRole="button"
      style={press({ minHeight: 44, flexDirection: "row", alignItems: "center", gap: 4 })}
    >
      <View style={{ transform: [{ rotate: "180deg" }] }}>
        <Icon name="chevron" size={14} strokeWidth={2.2} color={colors.labelAccent} />
      </View>
      <Text
        style={{
          fontFamily: fonts.monoMedium,
          fontSize: 12,
          letterSpacing: 0.5,
          textTransform: "uppercase",
          color: colors.labelAccent,
        }}
      >
        {label ?? t("common.back")}
      </Text>
    </Pressable>
  );
}
