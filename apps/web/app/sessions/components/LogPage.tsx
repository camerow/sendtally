import React from "react";
import { useSearchParams } from "react-router";
import type {
  Activity,
  ConnectionStatus,
  HangHistoryRow,
  JournalEntry,
  SessionRow,
} from "@sendtally/api-client";
import { useGyms } from "@sendtally/features/gyms";
import { t } from "@sendtally/features/i18n";
import { logItems, logSegmentItems, type LogSegment } from "@sendtally/features/journal";
import { ClimbingLog } from "../../climbs/components/ClimbingLog";
import { AccountButton } from "../../components/AccountButton";
import { Segmented } from "../../components/Segmented";
import { useAppApi } from "../../lib/useAppApi";
import { useDismissed } from "../../lib/useDismissed";
import { LogMenu } from "./LogMenu";
import { SetupStack, type SetupCard } from "./SetupStack";
import { TrainingLog } from "./TrainingLog";

export type LogPageProps = {
  status: ConnectionStatus;
  sessions: SessionRow[];
  hangSessions: HangHistoryRow[];
  activities: Activity[];
  entries: JournalEntry[];
};

/** The Log page in two halves, Climbing and Training, each in the URL; Training narrows to one workout by `?workout=`. */
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
  const [params, setParams] = useSearchParams();
  const workout = params.get("workout");
  const segment: LogSegment =
    params.get("segment") === "training" || workout !== null ? "training" : "climbing";
  const setQuery = (change: (p: URLSearchParams) => void): void =>
    setParams(
      (was) => {
        const next = new URLSearchParams(was);
        change(next);
        return next;
      },
      { replace: true, preventScrollReset: true }
    );
  const all = React.useMemo(
    () => logItems(sessions, entries, hangSessions, activities),
    [sessions, entries, hangSessions, activities]
  );
  const items = React.useMemo(() => logSegmentItems(all, segment), [all, segment]);
  const empty = items.length === 0 && (segment === "climbing" || workout === null);

  return (
    <div className="log-page">
      <div className="log-page-head">
        <h1 className="log-page-title">{t("journal.log")}</h1>
        {!empty && <LogMenu variant="header" />}
        <AccountButton />
      </div>
      <div className="log-segments">
        <Segmented
          label={t("journal.log")}
          options={[
            { value: "climbing", label: t("statistics.climbing") },
            { value: "training", label: t("statistics.training") },
          ]}
          value={segment}
          onChange={(next) =>
            setQuery((p) => {
              p.delete("workout");
              p.delete("status");
              if (next === "climbing") p.delete("segment");
              else p.set("segment", next);
            })
          }
        />
      </div>
      {workout === null && <SetupStack cards={setupCards} total={2} />}
      {segment === "climbing" ? (
        <ClimbingLog items={items} />
      ) : (
        <TrainingLog
          items={items}
          workout={workout}
          onClearWorkout={() => setQuery((p) => p.delete("workout"))}
        />
      )}
      {!empty && <LogMenu variant="fab" />}
    </div>
  );
}
