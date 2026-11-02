import { router } from "expo-router";
import React from "react";
import { useSharedValue } from "react-native-reanimated";
import { Text, View } from "react-native";
import { useSettings } from "@sendtally/features/settings";
import { SafeAreaView } from "react-native-safe-area-context";
import { logItems, logSegmentItems, today, type LogTraining } from "@sendtally/features/journal";
import { t } from "@sendtally/features/i18n";
import { queries, useQueryPair } from "@sendtally/features/query";
import { colors, fonts } from "@sendtally/design/tokens";
import { AccountButton } from "../../components/AccountButton";
import { ScreenHeader } from "../../components/ScreenHeader";
import { useLiveSession } from "@sendtally/features/log-session";
import { liveSessionStorage } from "../../lib/liveSessionStorage";
import { logSegmentStorage } from "../../lib/logSegmentStorage";
import { useStoredSegment } from "../../lib/storedSegment";
import { UpdateReadyCard } from "../app-update/UpdateReadyCard";
import { ClimbingLog } from "../climbs/ClimbingLog";
import { LogFab } from "../live-session/LogFab";
import { Segmented } from "../training/components/Segmented";
import { SegmentPager } from "../../components/SegmentPager";
import { SetupStack, type SetupCard } from "./SetupStack";
import { TrainingLog } from "./TrainingLog";
import { useStravaConnect } from "../settings/useStravaConnect";
import { useApi } from "../../lib/api";
import { maybeAskForReview } from "../../lib/review";
import { useSetupDismissed } from "../../lib/setupPrompt";
import { useGyms } from "@sendtally/features/gyms";
import { blockGroups, blockRecap, useTrainingLog } from "@sendtally/features/training";

/** The log in two halves, Climbing and Training, each with its own way to add to it. */
export function SessionsLog(): React.ReactElement {
  const api = useApi();
  const [segment, setSegment] = useStoredSegment(logSegmentStorage);
  const log = useQueryPair(queries.sessions(api), queries.entries(api));
  const [sessionLog, entries] = log.state.status === "ready" ? log.state.data : [null, null];
  const sessions = sessionLog?.sessions ?? null;
  const hangSessions = sessionLog?.hangSessions ?? null;
  const activities = sessionLog?.activities ?? null;
  const error = log.state.status === "error" || log.refreshFailed ? t("sessions.loadFailed") : null;
  // ponytail: a second status() read per mount, to know if Strava is live; a Strava-status context across tabs if it ever matters
  const settings = useSettings(api);
  const live = useLiveSession(liveSessionStorage);
  const connect = useStravaConnect(api, settings.reload);
  const gyms = useGyms(api);
  const gymPrompt = useSetupDismissed("gym");
  const stravaPrompt = useSetupDismissed("strava");
  const setupCards: SetupCard[] = [];
  if (gyms.ready && gyms.gyms.length === 0 && gymPrompt.dismissed === false) {
    setupCards.push({
      key: "gym",
      eyebrow: t("gyms.gym"),
      title: t("gyms.setupTitle"),
      body: t("gyms.setupBody"),
      action: t("gyms.setupAction"),
      onAction: () => router.push({ pathname: "/gym/[id]", params: { id: "new" } }),
      onDismiss: gymPrompt.dismiss,
    });
  }
  if (settings.ready && !settings.vm.stravaActive && stravaPrompt.dismissed === false) {
    const lapsed = settings.vm.stravaConnected;
    setupCards.push({
      key: "strava",
      eyebrow: lapsed ? t("sessions.setupEyebrowLapsed") : t("sessions.setupEyebrow"),
      title: lapsed ? t("sessions.setupLapsedTitle") : t("sessions.setupTitle"),
      body: lapsed ? t("sessions.setupLapsedBody") : t("sessions.setupBody"),
      action: connect.busy
        ? t("settings.openingStrava")
        : lapsed
          ? t("settings.relinkStrava")
          : t("sessions.connectStrava"),
      busy: connect.busy,
      error: connect.error,
      onAction: connect.connect,
      onDismiss: stravaPrompt.dismiss,
    });
  }

  const { log: training } = useTrainingLog(api);
  const blocks = React.useMemo((): LogTraining => {
    const day = today();
    return {
      plan: training.plan,
      finished: blockGroups(training.plan.blocks, day).past.map((b) =>
        blockRecap(training, b, day)
      ),
    };
  }, [training]);
  const items = React.useMemo(
    () =>
      sessions === null
        ? null
        : logItems(sessions, entries ?? [], hangSessions ?? [], activities ?? [], blocks),
    [sessions, entries, hangSessions, activities, blocks]
  );
  const progress = useSharedValue(segment === "climbing" ? 0 : 1);

  const sessionCount = sessions?.length;
  React.useEffect(() => {
    if (sessionCount !== undefined) void maybeAskForReview(sessionCount);
  }, [sessionCount]);

  const header = (
    <>
      <UpdateReadyCard liveSession={live.stored !== null} />
      <SetupStack cards={setupCards} total={2} />
    </>
  );

  const segments = [
    { value: "climbing" as const, label: t("statistics.climbing") },
    { value: "training" as const, label: t("statistics.training") },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={["top"]}>
      <ScreenHeader title={t("journal.log")} right={<AccountButton />} />
      <View style={{ paddingHorizontal: 18, paddingTop: 4, paddingBottom: 8 }}>
        <Segmented value={segment} onChange={setSegment} options={segments} progress={progress} />
      </View>
      {error !== null && (
        <Text
          style={{
            paddingHorizontal: 18,
            paddingVertical: 8,
            fontFamily: fonts.mono,
            fontSize: 12,
            color: colors.watermelonInk,
          }}
        >
          {error}
        </Text>
      )}
      <SegmentPager
        options={segments}
        value={segment}
        onChange={setSegment}
        progress={progress}
        renderPage={(page) => {
          const shown = items === null ? null : logSegmentItems(items, page);
          return page === "climbing" ? (
            <ClimbingLog items={shown} header={header} onRefresh={log.reload} />
          ) : (
            <TrainingLog items={shown} header={header} onRefresh={log.reload} />
          );
        }}
      />
      <LogFab segment={segment} />
    </SafeAreaView>
  );
}
