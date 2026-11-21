import React from "react";
import { Pressable, Text, View } from "react-native";
import { t } from "@sendtally/features/i18n";
import { colors, fonts } from "@sendtally/design/tokens";
import { goBack } from "../lib/goBack";
import { press } from "../lib/press";
import { FLOATING, FloatingBar } from "./FloatingBar";
import { Icon } from "./Icon";

export function BackButton({
  label,
  onPress = () => goBack(),
}: {
  label?: string;
  onPress?: () => void;
}): React.ReactElement {
  const floating = React.useContext(FloatingBar);
  if (floating)
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label ?? t("common.back")}
        style={press([
          {
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: "center",
            justifyContent: "center",
          },
          FLOATING,
        ])}
      >
        <View style={{ transform: [{ rotate: "180deg" }] }}>
          <Icon name="chevron" size={16} strokeWidth={2.2} color={colors.gunmetal} />
        </View>
      </Pressable>
    );
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={press({ minHeight: 44, flexDirection: "row", alignItems: "center", gap: 4 })}
    >
      <View style={{ transform: [{ rotate: "180deg" }] }}>
        <Icon name="chevron" size={14} strokeWidth={2.2} color={colors.gunmetal} />
      </View>
      <Text
        style={{
          fontFamily: fonts.monoMedium,
          fontSize: 12,
          letterSpacing: 0.5,
          textTransform: "uppercase",
          color: colors.gunmetal,
        }}
      >
        {label ?? t("common.back")}
      </Text>
    </Pressable>
  );
}
