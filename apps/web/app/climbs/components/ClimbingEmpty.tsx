import React from "react";
import { t } from "@sendtally/features/i18n";
import { countLabel } from "@sendtally/features/sessions";
import { useStartLiveSession } from "../../live-session/useStartLiveSession";
import { LogEmpty } from "../../sessions/components/LogEmpty";

/** The climbing log before its first session: a preview, Live session, and the other ways in. */
export function ClimbingEmpty(): React.ReactElement {
  const startLive = useStartLiveSession();
  return (
    <LogEmpty
      count={countLabel(2)}
      examples={[
        { daysAgo: 2, title: t("sessions.exampleEvening"), meta: t("sessions.exampleEveningMeta") },
        { daysAgo: 5, title: t("sessions.exampleCrag"), meta: t("sessions.exampleCragMeta") },
      ]}
      title={t("sessions.firstSessionLabel")}
      primary={{ label: t("sessions.liveSession"), onPress: startLive }}
      actions={[
        { key: "past", icon: "sessions", title: t("climbs.logSession"), to: "/app/sessions/new" },
        { key: "climb", icon: "climbs", title: t("climbs.addClimb"), to: "/app/log/climbs/new" },
        { key: "import", icon: "import", title: t("climbs.importLog"), to: "/app/import" },
      ]}
    />
  );
}
