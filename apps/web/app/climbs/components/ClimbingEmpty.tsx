import React from "react";
import { t } from "@sendtally/features/i18n";
import { countLabel } from "@sendtally/features/sessions";
import { LogEmpty } from "../../sessions/components/LogEmpty";

/** The climbing log before its first session: a preview, Log session, and the other ways in. */
export function ClimbingEmpty(): React.ReactElement {
  return (
    <LogEmpty
      count={countLabel(2)}
      examples={[
        { daysAgo: 2, title: t("sessions.exampleEvening"), meta: t("sessions.exampleEveningMeta") },
        { daysAgo: 5, title: t("sessions.exampleCrag"), meta: t("sessions.exampleCragMeta") },
      ]}
      title={t("sessions.firstSessionLabel")}
      primary={{ label: t("climbs.logSession"), to: "/app/sessions/new" }}
      actions={[
        { key: "climb", icon: "climbs", title: t("climbs.addClimb"), to: "/app/log/climbs/new" },
        { key: "import", icon: "import", title: t("climbs.importLog"), to: "/app/import" },
      ]}
    />
  );
}
