import React from "react";
import { Pressable, Text, View } from "react-native";
import type { StravaPostingFeature } from "@sendtally/features/settings";
import { t } from "@sendtally/features/i18n";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { DateTimeField } from "../../components/DateTimeField";
import { bodyText, messageText } from "../../lib/styles";
import { press } from "../../lib/press";

export type StravaPostingSectionProps = {
  posting: StravaPostingFeature;
};

const rowTitle = {
  fontFamily: fonts.sansSemiBold,
  fontSize: 13,
  color: colors.gunmetal,
} as const;

function Switch({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled: boolean;
  label: string;
}): React.ReactElement {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked, disabled }}
      accessibilityLabel={label}
      disabled={disabled}
      onPress={() => onChange(!checked)}
      hitSlop={10}
      style={press({
        width: 46,
        height: 28,
        borderRadius: radius.pill,
        padding: 3,
        justifyContent: "center",
        backgroundColor: checked ? colors.azureInk : "rgba(64,63,76,0.22)",
        opacity: disabled ? 0.55 : 1,
      })}
    >
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: radius.pill,
          backgroundColor: colors.white,
          marginLeft: checked ? 18 : 0,
        }}
      />
    </Pressable>
  );
}

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
