import React from "react";
import { Text, View } from "react-native";
import { colors, fonts } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";

export const STRAVA_ORANGE = "#fc4c02";

/** A session as it posts to Strava, for the Strava card. */
export function StravaArt(): React.ReactElement {
  return (
    <View
      style={{
        alignSelf: "center",
        width: "78%",
        gap: 4,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 12,
        backgroundColor: colors.white,
        shadowColor: "#000",
        shadowOpacity: 0.25,
        shadowRadius: 9,
        shadowOffset: { width: 0, height: 6 },
      }}
    >
      <Text style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.textMuted }}>
        {`Rock Climbing · ${t("training.today")}`}
      </Text>
      <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.gunmetal }}>
        {t("onboarding.setup.stravaArtName")}
      </Text>
      <Text style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.gunmetal }}>RPE 7/10</Text>
    </View>
  );
}
