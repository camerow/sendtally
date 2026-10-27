import React from "react";
import { Pressable, Text } from "react-native";
import { t } from "@sendtally/features/i18n";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { pressRow } from "../../lib/press";

export type CragBoxProps = { name: string | null; onChange: () => void };

export function CragBox({ name, onChange }: CragBoxProps): React.ReactElement {
  return (
    <Pressable
      onPress={onChange}
      accessibilityRole="button"
      accessibilityLabel={`${t("areas.crag")}, ${name ?? t("climbs.noCrag")}, ${t("climbs.change")}`}
      style={pressRow({
        minHeight: 50,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        paddingHorizontal: 14,
        borderRadius: radius.control + 2,
        backgroundColor: colors.surfaceSoft,
      })}
    >
      <Text
        numberOfLines={1}
        style={{
          flex: 1,
          fontFamily: name === null ? fonts.sans : fonts.sansSemiBold,
          fontSize: 15,
          color: name === null ? colors.textSecondary : colors.gunmetal,
        }}
      >
        {name ?? t("climbs.noCrag")}
      </Text>
      <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.azureInk }}>
        {t("climbs.change")}
      </Text>
    </Pressable>
  );
}
