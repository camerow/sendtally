import { router } from "expo-router";
import React from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { useStoredDraft } from "@sendtally/features/log-session";
import { formatDate, t } from "@sendtally/features/i18n";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { press, pressRow } from "../../lib/press";
import { sessionDraftStorage } from "../../lib/sessionDraftStorage";

export function DraftSessionRow(): React.ReactElement | null {
  const { stored, discard } = useStoredDraft(sessionDraftStorage);
  if (stored === null) return null;

  const { draft, savedAt } = stored;
  const count = draft.climbs.length;
  const climbs = t("common.climbCount", { count });
  const meta = t("logSession.draftMetaShort", {
    climbs,
    start: draft.startTime,
    end: draft.endTime,
  });

  function confirmDiscard(): void {
    Alert.alert(
      t("common.discardDraftTitle"),
      t("common.discardDraftBody", { count, day: formatDate(savedAt, { weekday: "long" }) }),
      [
        { text: t("common.cancel"), style: "cancel" },
        { text: t("common.discard"), style: "destructive", onPress: discard },
      ]
    );
  }

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingRight: 18,
        backgroundColor: "rgba(249,220,92,0.16)",
        borderBottomWidth: 1,
        borderBottomColor: colors.lineOnLightSoft,
      }}
    >
      <Pressable
        onPress={() => router.push("/session/new")}
        accessibilityRole="button"
        accessibilityLabel={`${t("sessions.unfinishedSession")}, ${meta}, ${t("sessions.resume")}`}
        style={pressRow({
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          paddingVertical: 11,
          paddingLeft: 18,
          paddingRight: 12,
        })}
      >
        <View style={{ width: 34 }}>
          <Text
            style={{
              fontFamily: fonts.monoMedium,
              fontSize: 9,
              lineHeight: 11,
              letterSpacing: 0.72,
              textTransform: "uppercase",
              color: colors.textMuted,
            }}
          >
            {formatDate(savedAt, { weekday: "short" })}
          </Text>
          <Text
            style={{
              fontFamily: fonts.monoSemiBold,
              fontSize: 17,
              lineHeight: 20,
              letterSpacing: -0.2,
              color: colors.gunmetal,
            }}
          >
            {formatDate(savedAt, { day: "numeric" })}
          </Text>
        </View>
        <View style={{ flex: 1, gap: 3 }}>
          <Text
            numberOfLines={1}
            style={{
              fontFamily: fonts.sansSemiBold,
              fontSize: 15,
              lineHeight: 19,
              color: colors.gunmetal,
            }}
          >
            {t("sessions.unfinishedSession")}
          </Text>
          <Text
            numberOfLines={1}
            style={{
              fontFamily: fonts.mono,
              fontSize: 11,
              lineHeight: 14,
              color: colors.textSecondary,
            }}
          >
            {meta}
          </Text>
        </View>
      </Pressable>
      <Pressable
        onPress={confirmDiscard}
        accessibilityRole="button"
        accessibilityLabel={t("common.discard")}
        hitSlop={8}
        style={press({
          minHeight: 32,
          paddingHorizontal: 12,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: radius.control,
          borderWidth: 1,
          borderColor: "rgba(64,63,76,0.28)",
        })}
      >
        <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.gunmetal }}>
          {t("common.discard")}
        </Text>
      </Pressable>
    </View>
  );
}
