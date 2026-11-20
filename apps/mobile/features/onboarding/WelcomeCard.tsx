import React from "react";
import { View } from "react-native";
import { t } from "@sendtally/features/i18n";
import { displayGrade } from "@sendtally/features/sessions";
import { useDisplayScales } from "@sendtally/features/settings";
import { DarkTile } from "../../components/DarkTile";
import { SamplePyramid } from "../../components/SamplePyramid";
import { DarkCard } from "../first-run/components/DarkCard";

const SAMPLE = { avgSend: 4, sends: 12, flashed: 3, projects: 1 };

/** The wizard's payoff card, drawn from sample climbs: what a new climber is about to make. */
export function WelcomeCard(): React.ReactElement {
  const scales = useDisplayScales();
  return (
    <DarkCard label={t("onboarding.setup.welcomeCard")}>
      <SamplePyramid tone="dark" />
      <View style={{ flexDirection: "row", gap: 6 }}>
        <DarkTile
          value={displayGrade({ scale: "v", value: SAMPLE.avgSend }, scales)}
          label={t("climbs.avgSendWord")}
        />
        <DarkTile value={SAMPLE.sends} label={t("climbs.sendsWord", { count: SAMPLE.sends })} />
        <DarkTile value={SAMPLE.flashed} label={t("climbs.flashedWord")} />
        <DarkTile
          value={SAMPLE.projects}
          label={t("climbs.projectsWord", { count: SAMPLE.projects })}
        />
      </View>
    </DarkCard>
  );
}
