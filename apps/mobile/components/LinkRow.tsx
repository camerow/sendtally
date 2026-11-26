import React from "react";
import { Pressable, Text } from "react-native";
import { colors, fonts } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { press } from "../lib/press";
import { Icon } from "./Icon";
import { Lock } from "./Lock";

export type LinkRowProps = {
  label: string;
  onPress: () => void;
  /** Members only: the label muted and the lock in place of the chevron. */
  locked?: boolean;
};

export function LinkRow({ label, onPress, locked = false }: LinkRowProps): React.ReactElement {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={locked ? t("common.membersOnly", { label }) : label}
      style={press({
        minHeight: 44,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      })}
    >
      <Text
        style={{
          fontFamily: fonts.sansSemiBold,
          fontSize: 14,
          color: locked ? colors.textMuted : colors.azureInk,
        }}
      >
        {label}
      </Text>
      {locked ? <Lock /> : <Icon name="chevron" color={colors.azureInk} size={18} />}
    </Pressable>
  );
}
