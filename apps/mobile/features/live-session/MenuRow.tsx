import React from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import type { EntryKind } from "@sendtally/features/journal";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { Icon, type IconName } from "../../components/Icon";
import { Lock } from "../../components/Lock";
import { StravaMark } from "../../components/StravaMark";
import { pressRow } from "../../lib/press";
import { EntryKindIcon } from "../journal/EntryKindIcon";

export type MenuRowProps = {
  icon: IconName | EntryKind | "strava";
  title: string;
  /** A line under the title; left out when the title says it all. */
  hint?: string;
  onPress: () => void;
  /** Red, for what removes something. */
  danger?: boolean;
  /** Under way: a spinner in place of the chevron, and no second press. */
  busy?: boolean;
  /** Leaves the app: an arrow out in place of the chevron. */
  external?: boolean;
  /** Members only: muted, with the lock in place of the chevron. */
  locked?: boolean;
};

const iconOf = (icon: MenuRowProps["icon"], ink: string): React.ReactElement => {
  if (icon === "strava") return <StravaMark size={20} />;
  if (icon === "journal" || icon === "trip" || icon === "injury") {
    return <EntryKindIcon kind={icon} size={20} color={ink} />;
  }
  return <Icon name={icon} size={20} strokeWidth={2} color={ink} />;
};

export function MenuRow({
  icon,
  title,
  hint,
  onPress,
  danger = false,
  busy = false,
  external = false,
  locked = false,
}: MenuRowProps): React.ReactElement {
  const ink = danger ? colors.watermelonInk : locked ? colors.textMuted : colors.gunmetal;
  return (
    <Pressable
      onPress={onPress}
      disabled={busy}
      accessibilityRole="button"
      accessibilityLabel={locked ? t("common.membersOnly", { label: title }) : undefined}
      accessibilityState={{ disabled: busy, busy }}
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
          backgroundColor: danger ? "rgba(196,48,61,0.1)" : colors.surfaceSoft,
        }}
      >
        {iconOf(icon, ink)}
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <Text
          style={{
            fontFamily: fonts.sansSemiBold,
            fontSize: 15,
            lineHeight: 19,
            color: ink,
          }}
        >
          {title}
        </Text>
        {hint !== undefined && (
          <Text
            style={{
              fontFamily: fonts.sans,
              fontSize: 13,
              lineHeight: 18,
              color: colors.textMuted,
            }}
          >
            {hint}
          </Text>
        )}
      </View>
      {busy ? (
        <ActivityIndicator color={colors.gunmetal} />
      ) : locked ? (
        <Lock />
      ) : (
        <Icon
          name={external ? "external" : "chevron"}
          size={external ? 14 : 12}
          strokeWidth={2}
          color="rgba(64,63,76,0.35)"
        />
      )}
    </Pressable>
  );
}
