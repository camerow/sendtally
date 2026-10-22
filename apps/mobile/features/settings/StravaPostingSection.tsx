import React from "react";
import { Text, View } from "react-native";
import type { StravaPostingFeature } from "@sendtally/features/settings";
import { t } from "@sendtally/features/i18n";
import { colors, fonts } from "@sendtally/design/tokens";
import { DateTimeField } from "../../components/DateTimeField";
import { bodyText, messageText } from "../../lib/styles";
import { SwitchRow } from "./SwitchRow";
import { TrainingStravaRows } from "./TrainingStravaRows";

export type StravaPostingSectionProps = {
  posting: StravaPostingFeature;
  /** Training mode adds switches for hangboard sessions and other training. */
  training: boolean;
};

const rowTitle = {
  fontFamily: fonts.sansSemiBold,
  fontSize: 13,
  color: colors.gunmetal,
} as const;

export function StravaPostingSection({
  posting,
  training,
}: StravaPostingSectionProps): React.ReactElement {
  const title = training ? t("settings.postClimbing") : t("settings.postAutomatically");
  return (
    <>
      <SwitchRow
        title={title}
        body={posting.enabled ? t("settings.postingOn") : t("settings.postingOffMobile")}
        checked={posting.enabled}
        disabled={posting.busy}
        onChange={posting.setEnabled}
      />

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

      {training && <TrainingStravaRows posting={posting} />}

      {posting.error !== null && <Text style={messageText}>{posting.error}</Text>}
    </>
  );
}
