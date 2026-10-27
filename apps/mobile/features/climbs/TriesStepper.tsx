import React from "react";
import { Pressable, Text, View } from "react-native";
import { t } from "@sendtally/features/i18n";
import { colors, fonts } from "@sendtally/design/tokens";
import { press } from "../../lib/press";

export function TriesStepper({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}): React.ReactElement {
  const button = (sign: -1 | 1): React.ReactElement => (
    <Pressable
      onPress={() => onChange(Math.min(99, Math.max(1, value + sign)))}
      accessibilityRole="button"
      accessibilityLabel={sign < 0 ? t("climbs.fewerTries") : t("climbs.moreTries")}
      style={press({
        width: 50,
        height: 50,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.lineOnLightStrong,
        alignItems: "center",
        justifyContent: "center",
      })}
    >
      <Text style={{ fontFamily: fonts.sans, fontSize: 22, color: colors.gunmetal }}>
        {sign < 0 ? "−" : "+"}
      </Text>
    </Pressable>
  );
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
      {button(-1)}
      <Text
        style={{
          flex: 1,
          textAlign: "center",
          fontFamily: fonts.displayHeavy,
          fontSize: 30,
          color: colors.gunmetal,
        }}
      >
        {value}
      </Text>
      {button(1)}
    </View>
  );
}
