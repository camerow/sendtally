import React from "react";
import { Pressable, Text, View } from "react-native";
import type { EntryKind } from "@sendtally/features/journal";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { Icon, type IconName } from "../../components/Icon";
import { pressRow } from "../../lib/press";
import { EntryKindIcon } from "../journal/EntryKindIcon";

export type MenuRowProps = {
  icon: IconName | EntryKind;
  title: string;
  hint: string;
  onPress: () => void;
};

export function MenuRow({ icon, title, hint, onPress }: MenuRowProps): React.ReactElement {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={pressRow({
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        minHeight: 64,
        paddingHorizontal: 14,
        borderRadius: radius.card,
      })}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.surfaceSoft,
        }}
      >
        {icon === "journal" || icon === "trip" || icon === "injury" ? (
          <EntryKindIcon kind={icon} size={20} color={colors.gunmetal} />
        ) : (
          <Icon name={icon} size={20} strokeWidth={2} color={colors.gunmetal} />
        )}
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <Text
          style={{
            fontFamily: fonts.sansSemiBold,
            fontSize: 15,
            lineHeight: 19,
            color: colors.gunmetal,
          }}
        >
          {title}
        </Text>
        <Text
          style={{ fontFamily: fonts.sans, fontSize: 13, lineHeight: 18, color: colors.textMuted }}
        >
          {hint}
        </Text>
      </View>
      <Icon name="chevron" size={12} strokeWidth={2} color="rgba(64,63,76,0.35)" />
    </Pressable>
  );
}
