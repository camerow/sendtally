import React from "react";
import { Pressable, Text, View } from "react-native";
import { t } from "@sendtally/features/i18n";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { Icon } from "../../components/Icon";
import { press } from "../../lib/press";
import { useUpdateRestart } from "./useUpdateRestart";

export function UpdateReadyCard({
  liveSession,
}: {
  liveSession: boolean;
}): React.ReactElement | null {
  const { pendingUpdateId, restarting, restart } = useUpdateRestart();
  const [dismissedId, setDismissedId] = React.useState<string | null>(null);
  if (pendingUpdateId === null || pendingUpdateId === dismissedId) return null;

  return (
    <View
      style={{
        marginHorizontal: 18,
        marginTop: 8,
        marginBottom: 6,
        paddingVertical: 12,
        paddingLeft: 14,
        paddingRight: 4,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: colors.lineOnLightStrong,
        borderRadius: radius.card,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.gold,
        }}
      >
        <Icon name="refresh" size={18} strokeWidth={2.2} color={colors.gunmetal} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text
          style={{
            fontFamily: fonts.sansSemiBold,
            fontSize: 15,
            lineHeight: 19,
            color: colors.gunmetal,
          }}
        >
          {t("appUpdate.ready")}
        </Text>
        <Text
          style={{
            fontFamily: fonts.sans,
            fontSize: 12,
            lineHeight: 16,
            color: colors.textSecondary,
          }}
        >
          {liveSession ? t("appUpdate.readyBodyLive") : t("appUpdate.readyBody")}
        </Text>
      </View>
      <Pressable
        onPress={restart}
        disabled={restarting}
        accessibilityRole="button"
        style={press({
          minHeight: 44,
          paddingHorizontal: 14,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: radius.control,
          backgroundColor: colors.gunmetal,
          opacity: restarting ? 0.55 : 1,
        })}
      >
        <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.white }}>
          {t("appUpdate.restart")}
        </Text>
      </Pressable>
      <Pressable
        onPress={() => setDismissedId(pendingUpdateId)}
        accessibilityRole="button"
        accessibilityLabel={t("sessions.notNow")}
        style={press({ width: 36, minHeight: 44, alignItems: "center", justifyContent: "center" })}
      >
        <Icon name="x" size={14} strokeWidth={2.2} color={colors.textMuted} />
      </Pressable>
    </View>
  );
}
