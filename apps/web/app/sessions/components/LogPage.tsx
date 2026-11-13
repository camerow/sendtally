import React from "react";
import type {
  Activity,
  ConnectionStatus,
  HangHistoryRow,
  JournalEntry,
  SessionRow,
} from "@sendtally/api-client";
import { useGyms } from "@sendtally/features/gyms";
import { t } from "@sendtally/features/i18n";
import { logItems } from "@sendtally/features/journal";
import { ClimbingLog } from "../../climbs/components/ClimbingLog";
import { AccountButton } from "../../components/AccountButton";
import { useAppApi } from "../../lib/useAppApi";
import { useDismissed } from "../../lib/useDismissed";
import { LogMenu } from "./LogMenu";
import { SetupStack, type SetupCard } from "./SetupStack";

export type LogPageProps = {
  status: ConnectionStatus;
  sessions: SessionRow[];
  hangSessions: HangHistoryRow[];
  activities: Activity[];
  entries: JournalEntry[];
};

/** The Log page: setup cards and the climbing log. */
export function LogPage({
  status,
  sessions,
  hangSessions,
  activities,
  entries,
}: LogPageProps): React.ReactElement {
  const api = useAppApi();
  const gyms = useGyms(api);
  const gymPrompt = useDismissed("gym");
  const stravaPrompt = useDismissed("strava");
  const stravaConnected = status.strava?.status === "active";
  const stravaLapsed = status.strava !== null && !stravaConnected;
  const setupCards: SetupCard[] = [];
  if (gyms.ready && gyms.gyms.length === 0 && gymPrompt.dismissed === false) {
    setupCards.push({
      key: "gym",
      eyebrow: t("gyms.gym"),
      title: t("gyms.setupTitle"),
      body: t("gyms.setupBody"),
      action: t("gyms.setupAction"),
      to: "/app/settings/gyms/new",
      onDismiss: gymPrompt.dismiss,
    });
  }
  if (!stravaConnected && stravaPrompt.dismissed === false) {
    setupCards.push({
      key: "strava",
      eyebrow: stravaLapsed ? t("sessions.setupEyebrowLapsed") : t("sessions.setupEyebrow"),
      title: stravaLapsed ? t("sessions.setupLapsedTitle") : t("sessions.setupTitle"),
      body: stravaLapsed ? t("sessions.setupLapsedBody") : t("sessions.setupBody"),
      action: stravaLapsed ? t("settings.relinkStrava") : t("sessions.connectStrava"),
      to: "/app/setup",
      onDismiss: stravaPrompt.dismiss,
    });
  }
  const items = React.useMemo(
    () => logItems(sessions, entries, hangSessions, activities),
    [sessions, entries, hangSessions, activities]
  );

  return (
    <div className="log-page">
      <div className="log-page-head">
        <h1 className="log-page-title">{t("journal.log")}</h1>
        {items.length > 0 && <LogMenu variant="header" />}
        <AccountButton />
      </div>
      <SetupStack cards={setupCards} total={2} />
      <ClimbingLog items={items} />
      {items.length > 0 && <LogMenu variant="fab" />}
    </div>
  );
}
