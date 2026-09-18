import React from "react";
import { Keyboard, Linking, Pressable, Text, View } from "react-native";
import { t } from "@sendtally/features/i18n";
import { colors, fonts } from "@sendtally/design/tokens";
import { WEB_URL } from "../../lib/config";
import { press } from "../../lib/press";
import { primaryButton, primaryButtonLabel } from "../../lib/styles";

/** The save button of an add sheet, with the CC0 line that says what saving shares. */
export function AreaSubmit({
  label,
  busy,
  error,
  onPress,
}: {
  label: string;
  busy: boolean;
  error: string | null;
  onPress: () => void;
}): React.ReactElement {
  return (
    <View style={{ gap: 10 }}>
      {error !== null && (
        <Text style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.watermelonInk }}>
          {error}
        </Text>
      )}
      <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
        <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: colors.textSecondary }}>
          {t("areas.licence")}
        </Text>
        <Pressable
          accessibilityRole="link"
          hitSlop={10}
          onPress={() => void Linking.openURL(`${WEB_URL}/terms`)}
        >
          <Text
            style={{
              fontFamily: fonts.sans,
              fontSize: 12,
              color: colors.azureInk,
              textDecorationLine: "underline",
            }}
          >
            {t("areas.licenceTerms")}
          </Text>
        </Pressable>
      </View>
      <Pressable
        accessibilityRole="button"
        disabled={busy}
        onPress={() => {
          Keyboard.dismiss();
          onPress();
        }}
        style={press({ ...primaryButton, opacity: busy ? 0.45 : 1 })}
      >
        <Text style={primaryButtonLabel}>{busy ? t("common.saving") : label}</Text>
      </Pressable>
    </View>
  );
}
