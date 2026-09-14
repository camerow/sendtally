import React from "react";
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
      <Text style={monoMuted}>{lapsed ? "STRAVA · RECONNECT NEEDED" : "STRAVA · OPTIONAL"}</Text>
      <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.gunmetal }}>
        {lapsed ? "Strava access has lapsed" : "Post sessions to your Strava feed"}
      </Text>
      <Text style={bodyText}>
        {lapsed
          ? "Re-link it and your sessions can post to your feed again."
          : "One Rock Climbing activity per logged session. Revoke it on strava.com any time."}
      </Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 14, marginTop: 6 }}>
        <Pressable
          onPress={connect.connect}
          disabled={connect.busy}
          accessibilityRole="button"
          style={press({
            flex: 1,
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
            {connect.busy ? "Opening Strava…" : lapsed ? "Re-link Strava" : "Connect Strava"}
          </Text>
        </Pressable>
        <Pressable
          onPress={onDismiss}
          accessibilityRole="button"
          hitSlop={8}
          style={press({ minHeight: 44, justifyContent: "center" })}
        >
          <Text
            style={{
              fontFamily: fonts.mono,
              fontSize: 11,
              color: colors.textMuted,
              textDecorationLine: "underline",
            }}
          >
            Not now
          </Text>
        </Pressable>
      </View>
      {connect.error !== null && <Text style={messageText}>{connect.error}</Text>}
    </View>
  );
}
