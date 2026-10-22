import React from "react";
import { Text, View } from "react-native";
import type { StravaPostingFeature } from "@sendtally/features/settings";
import { t } from "@sendtally/features/i18n";
import { colors, fonts } from "@sendtally/design/tokens";
import { DateTimeField } from "../../components/DateTimeField";
import { Switch } from "../../components/Switch";
import { bodyText, messageText } from "../../lib/styles";

export type StravaPostingSectionProps = {
  posting: StravaPostingFeature;
};

const rowTitle = {
  fontFamily: fonts.sansSemiBold,
  fontSize: 13,
  color: colors.gunmetal,
} as const;

export function StravaPostingSection({ posting }: StravaPostingSectionProps): React.ReactElement {
  return (
    <>
      <View style={{ borderTopWidth: 1, borderTopColor: colors.lineOnLight }} />

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 14,
          minHeight: 44,
        }}
      >
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={rowTitle}>{t("settings.postAutomatically")}</Text>
          <Text style={bodyText}>
            {posting.enabled ? t("settings.postingOn") : t("settings.postingOffMobile")}
          </Text>
        </View>
        <Switch
          checked={posting.enabled}
          onChange={posting.setEnabled}
          disabled={posting.busy}
          label={t("settings.postAutomatically")}
        />
      </View>

      {posting.enabled && (
        <>
          <View style={{ borderTopWidth: 1, borderTopColor: colors.lineOnLight }} />
          <View style={{ gap: 8 }}>
            <Text style={rowTitle}>{t("settings.postSince")}</Text>
            <Text style={bodyText}>{t("settings.postSinceBody")}</Text>
            <DateTimeField
              mode="date"
              value={posting.since}
              label={t("settings.postSince")}
              placeholder={t("settings.postSinceAny")}
              onChange={posting.setSince}
              disabled={posting.busy}
              onClear={() => posting.setSince("")}
            />
          </View>
        </>
      )}

      {posting.error !== null && <Text style={messageText}>{posting.error}</Text>}
    </>
  );
}
