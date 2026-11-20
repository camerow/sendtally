import React from "react";
import { View } from "react-native";
import { colors, radius } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { displayGrade } from "@sendtally/features/sessions";
import { useDisplayScales } from "@sendtally/features/settings";
import { SamplePyramid } from "../../components/SamplePyramid";
import { CountTile } from "../climbs/CountTile";
import { Label } from "../training/components/Label";

const SAMPLE = { avgSend: 4, sends: 12, flashed: 3, projects: 1 };

/** The wizard's payoff, drawn from sample climbs: what a new climber is about to make. */
export function WelcomeCard(): React.ReactElement {
  const scales = useDisplayScales();
  return (
    <View
      style={{
        gap: 12,
        padding: 16,
        borderRadius: radius.panel,
        backgroundColor: colors.surfaceSoft,
      }}
    >
      <Label color={colors.textSecondary}>{t("onboarding.setup.welcomeCard")}</Label>
      <SamplePyramid />
      <View style={{ flexDirection: "row", gap: 6 }}>
        <CountTile
          value={displayGrade({ scale: "v", value: SAMPLE.avgSend }, scales)}
          label={t("climbs.avgSendWord")}
        />
        <CountTile value={SAMPLE.sends} label={t("climbs.sendsWord", { count: SAMPLE.sends })} />
        <CountTile value={SAMPLE.flashed} label={t("climbs.flashedWord")} />
        <CountTile
          value={SAMPLE.projects}
          label={t("climbs.projectsWord", { count: SAMPLE.projects })}
        />
      </View>
    </View>
  );
}
