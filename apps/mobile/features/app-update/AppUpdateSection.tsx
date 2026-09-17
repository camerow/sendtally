import React from "react";
import { Pressable, Text, View } from "react-native";
import { t } from "@sendtally/features/i18n";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { Icon } from "../../components/Icon";
import { press } from "../../lib/press";
import { bodyText, sectionCard, sectionLabel } from "../../lib/styles";
import { useUpdateRestart } from "./useUpdateRestart";

/** Where a restart stays within reach after the card on the log is dismissed. */
export function AppUpdateSection(): React.ReactElement | null {
  const { pendingUpdateId, restarting, restart } = useUpdateRestart();
  if (pendingUpdateId === null) return null;

  return (
    <View
      style={{
        ...sectionCard,
        backgroundColor: colors.white,
        borderColor: colors.lineOnLightStrong,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={sectionLabel}>{t("appUpdate.app")}</Text>
        <Text
          style={{
            fontFamily: fonts.monoMedium,
            fontSize: 9,
            letterSpacing: 0.7,
            textTransform: "uppercase",
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: radius.pill,
            overflow: "hidden",
            backgroundColor: colors.gold,
            color: colors.gunmetal,
          }}
        >
          {t("appUpdate.badge")}
        </Text>
      </View>
      <Text style={bodyText}>{t("appUpdate.settingsBody")}</Text>
      <Pressable
        onPress={restart}
        disabled={restarting}
        accessibilityRole="button"
        style={press({
          minHeight: 46,
          flexDirection: "row",
          gap: 8,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: radius.control,
          backgroundColor: colors.gunmetal,
          opacity: restarting ? 0.55 : 1,
        })}
      >
        <Icon name="refresh" size={16} strokeWidth={2.2} color={colors.white} />
        <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.white }}>
          {t("appUpdate.restartNow")}
        </Text>
      </Pressable>
    </View>
  );
}
