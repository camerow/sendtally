import React from "react";
import { useRevalidator } from "react-router";
import type {
  Activity,
  ConnectionStatus,
  HangHistoryRow,
  JournalEntry,
  SessionRow,
} from "@sendtally/api-client";
import { useClimbVocabulary } from "@sendtally/features/climbs";
import { liveGymOfDraft, useGyms } from "@sendtally/features/gyms";
import { t } from "@sendtally/features/i18n";
import { logItems } from "@sendtally/features/journal";
import {
  circuitGyms,
  useClimbEditor,
  useLiveSession,
  useLiveSync,
  withClimbOutcome,
  withTries,
} from "@sendtally/features/log-session";
import { useGradeScalePrefs } from "@sendtally/features/settings";
import { ClimbingLog } from "../../climbs/components/ClimbingLog";
import { AccountButton } from "../../components/AccountButton";
import { liveSessionStorage } from "../../lib/localStorages";
import { useAppApi } from "../../lib/useAppApi";
import { useDismissed } from "../../lib/useDismissed";
import { LiveClimbEditor } from "./LiveClimbEditor";
import { LiveSessionCard } from "./LiveSessionCard";
import { LogMenu } from "./LogMenu";
import { SetupStack, type SetupCard } from "./SetupStack";

export type LogPageProps = {
  status: ConnectionStatus;
  sessions: SessionRow[];
  hangSessions: HangHistoryRow[];
  activities: Activity[];
  entries: JournalEntry[];
};

/** The Log page: setup cards, a live session in progress, and the climbing log. */
export function LogPage({
  status,
  sessions,
  hangSessions,
  activities,
  entries,
}: LogPageProps): React.ReactElement {
  const api = useAppApi();
  const { scales } = useGradeScalePrefs(api);
  const liveSync = useLiveSync(api, liveSessionStorage);
  const live = useLiveSession(liveSessionStorage, liveSync.sync);
  const vocabulary = useClimbVocabulary(api);
  const gyms = useGyms(api);
  const liveGym = liveGymOfDraft(gyms.gyms, live.stored?.draft.gymId);
  const circuitChoices = circuitGyms(gyms.gyms);
  const { revalidate } = useRevalidator();
  const climbEditor = useClimbEditor(live, api, circuitChoices, () => void revalidate());
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
      {live.stored !== null && (
        <LiveSessionCard
          stored={live.stored}
          status={liveSync.status}
          vocabulary={vocabulary}
          gym={liveGym}
          onEditClimb={climbEditor.open}
          onChangeTries={(key, tries) => live.updateClimb(key, (c) => withTries(c, tries))}
          onToggleSent={(key) =>
            live.updateClimb(key, (c) =>
              withClimbOutcome(
                c,
                c.kind === "send"
                  ? { kind: "attempt" }
                  : { kind: "send", style: c.tries === 1 ? "flash" : "redpoint" }
              )
            )
          }
        />
      )}
      <ClimbingLog items={items} />
      {items.length > 0 && <LogMenu variant="fab" />}
      <LiveClimbEditor
        editor={climbEditor}
        scales={scales}
        vocabulary={vocabulary}
        gyms={circuitChoices}
      />
    </div>
  );
}
