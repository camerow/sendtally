import React from "react";
import { t } from "@sendtally/features/i18n";
import { Pressable, Text, View } from "react-native";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import type { StravaConnectFeature } from "../settings/useStravaConnect";
import { bodyText, messageText, monoMuted } from "../../lib/styles";
import { press } from "../../lib/press";

export type StravaSetupRowProps = {
  lapsed: boolean;
  connect: StravaConnectFeature;
  onDismiss: () => void;
};

export function StravaSetupRow({
  lapsed,
  connect,
  onDismiss,
}: StravaSetupRowProps): React.ReactElement {
  return (
    <View
      style={{
        marginHorizontal: 18,
        marginTop: 8,
        marginBottom: 6,
        padding: 16,
        gap: 6,
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: colors.lineOnLight,
        borderRadius: radius.card,
      }}
    >
      <Text style={monoMuted}>
        {lapsed ? t("sessions.setupEyebrowLapsed") : t("sessions.setupEyebrow")}
      </Text>
      <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.gunmetal }}>
        {lapsed ? t("sessions.setupLapsedTitle") : t("sessions.setupTitle")}
      </Text>
      <Text style={bodyText}>
        {lapsed ? t("sessions.setupLapsedBody") : t("sessions.setupBody")}
      </Text>
      <View style={{ alignItems: "stretch", gap: 4, marginTop: 6 }}>
        <Pressable
          onPress={connect.connect}
          disabled={connect.busy}
          accessibilityRole="button"
          style={press({
            minHeight: 44,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: radius.control,
            borderWidth: 1,
            borderColor: colors.lineOnLightStrong,
            opacity: connect.busy ? 0.55 : 1,
          })}
        >
          <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.gunmetal }}>
            {connect.busy
              ? t("settings.openingStrava")
              : lapsed
                ? t("settings.relinkStrava")
                : t("sessions.connectStrava")}
          </Text>
        </Pressable>
        <Pressable
          onPress={onDismiss}
          accessibilityRole="button"
          hitSlop={8}
          style={press({ minHeight: 44, alignItems: "center", justifyContent: "center" })}
        >
          <Text
            style={{
              fontFamily: fonts.mono,
              fontSize: 11,
              color: colors.textMuted,
              textDecorationLine: "underline",
            }}
          >
            {t("sessions.notNow")}
          </Text>
        </Pressable>
      </View>
      {connect.error !== null && <Text style={messageText}>{connect.error}</Text>}
    </View>
  );
}
