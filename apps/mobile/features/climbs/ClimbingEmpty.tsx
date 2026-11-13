import { router } from "expo-router";
import React from "react";
import { countLabel } from "@sendtally/features/sessions";
import { t } from "@sendtally/features/i18n";
import { startLiveSession } from "../live-session/startLiveSession";
import { LogEmpty } from "../sessions/LogEmpty";

/** The climbing half before its first session: a preview, Start session, and the other ways in. */
export function ClimbingEmpty(): React.ReactElement {
  return (
    <LogEmpty
      count={countLabel(2)}
      examples={[
        { daysAgo: 2, title: t("sessions.exampleEvening"), meta: t("sessions.exampleEveningMeta") },
        { daysAgo: 5, title: t("sessions.exampleCrag"), meta: t("sessions.exampleCragMeta") },
      ]}
      title={t("sessions.firstSessionLabel")}
      primary={{ label: t("sessions.liveSession"), onPress: () => startLiveSession() }}
      actions={[
        {
          key: "past",
          icon: "sessions",
          title: t("climbs.logSession"),
          onPress: () => router.push("/session/new"),
        },
        {
          key: "climb",
          icon: "climbs",
          title: t("climbs.addClimb"),
          onPress: () => router.push("/climb/log"),
        },
        {
          key: "import",
          icon: "import",
          title: t("climbs.importLog"),
          onPress: () => router.push("/import"),
        },
      ]}
    />
  );
}
