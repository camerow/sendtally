import { router } from "expo-router";
import React from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  NO_LOG_FILTER,
  filterLog,
  logExerciseOptions,
  logFilterActive,
  logFilterPills,
  logItems,
  logPlaceOptions,
  logTraining,
  logWorkoutOptions,
  today,
  updateLogFilter,
  type LogContext,
  type LogFilter,
  type LogOption,
} from "@sendtally/features/journal";
import { useClimbs } from "@sendtally/features/climbs";
import { useGradeScalePrefs, useSettings } from "@sendtally/features/settings";
import { sessionTagOptions } from "@sendtally/features/sessions";
import { statsYears } from "@sendtally/features/trends";
import { t } from "@sendtally/features/i18n";
import { queries, useQueryPair } from "@sendtally/features/query";
import { colors, fonts } from "@sendtally/design/tokens";
import { AccountButton } from "../../components/AccountButton";
import { ScreenHeader } from "../../components/ScreenHeader";
import { ClimbingEmpty } from "../climbs/ClimbingEmpty";
import { LogFab } from "../live-session/LogFab";
import { ActiveFilters } from "./ActiveFilters";
import { emptyBody } from "./emptyStyles";
import { FilterSheet, type FilterChoices } from "./FilterSheet";
import { LogList } from "./LogList";
import { SetupStack, type SetupCard } from "./SetupStack";
import { useStravaConnect } from "../settings/useStravaConnect";
import { useApi } from "../../lib/api";
import { maybeAskForReview } from "../../lib/review";
import { useSetupDismissed } from "../../lib/setupPrompt";
import { useGyms } from "@sendtally/features/gyms";
import { useTrainingLog } from "@sendtally/features/training";

/** The one Log, newest first, narrowed by search and the filter sheet; a Stats link sets its Workout filter. */
export function SessionsLog({ workout = null }: { workout?: string | null }): React.ReactElement {
  const api = useApi();
  const log = useQueryPair(queries.sessions(api), queries.entries(api));
  const [sessionLog, entries] = log.state.status === "ready" ? log.state.data : [null, null];
  const sessions = sessionLog?.sessions ?? null;
  const hangSessions = sessionLog?.hangSessions ?? null;
  const activities = sessionLog?.activities ?? null;
  const error = log.state.status === "error" || log.refreshFailed ? t("sessions.loadFailed") : null;
  // ponytail: a second status() read per mount, to know if Strava is live; a Strava-status context across tabs if it ever matters
  const settings = useSettings(api);
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
  const blocks = React.useMemo(() => logTraining(training, today()), [training]);
  const items = React.useMemo(
    () =>
      sessions === null
        ? null
        : logItems(sessions, entries ?? [], hangSessions ?? [], activities ?? [], blocks),
    [sessions, entries, hangSessions, activities, blocks]
  );
  const climbs = useClimbs(api);
  const { scales } = useGradeScalePrefs(api);
  const climbData = climbs.state.status === "ready" ? climbs.state.data : null;
  const ctx = React.useMemo(
    (): LogContext => ({
      climbs: climbData?.climbs ?? [],
      sessions: climbData?.sessions ?? [],
      hangParts: sessionLog?.hangParts ?? [],
      memberships: training.plan.memberships,
      places: new Map([
        ...(climbData?.climbs ?? []).flatMap((c) =>
          c.area === null ? [] : [[c.area.id, c.area.name] as const]
        ),
        ...gyms.gyms.map((g) => [g.id, g.name] as const),
      ]),
      scales,
    }),
    [climbData, sessionLog, training.plan.memberships, gyms.gyms, scales]
  );
  const [filter, setFilter] = React.useState<LogFilter>(NO_LOG_FILTER);
  const [searching, setSearching] = React.useState(false);
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [linked, setLinked] = React.useState<string | null>(null);
  if (workout !== linked) {
    setLinked(workout);
    if (workout !== null) setFilter(updateLogFilter(NO_LOG_FILTER, { workout }));
  }
  React.useEffect(() => {
    if (workout !== null) router.setParams({ workout: undefined });
  }, [workout]);
  const view = React.useMemo(
    () => (items === null ? null : filterLog(items, filter, ctx)),
    [items, filter, ctx]
  );
  const choices = React.useMemo(
    (): FilterChoices => ({
      years: statsYears({
        sessions: sessions ?? [],
        hangSessions: hangSessions ?? [],
        activities: activities ?? [],
      }),
      tags: sessionTagOptions(items ?? []),
      places: logPlaceOptions(items ?? [], ctx),
      exercises: logExerciseOptions(items ?? [], ctx),
      blocks: training.plan.blocks.map((b) => ({ key: b.id, name: b.name })),
      workouts: logWorkoutOptions(items ?? [], ctx, (id) => training.workout(id)?.name ?? null),
    }),
    [sessions, hangSessions, activities, items, ctx, training]
  );
  const pills = React.useMemo(() => {
    const named = (options: readonly LogOption[], key: string): string =>
      options.find((o) => o.key === key)?.name ?? key;
    return logFilterPills(filter, {
      tag: (slug) => choices.tags.find((tag) => tag.slug === slug)?.name ?? slug,
      place: (key) => named(choices.places, key),
      exercise: (key) => named(choices.exercises, key),
      block: (key) => named(choices.blocks, key),
      workout: (key) => named(choices.workouts, key),
    });
  }, [filter, choices]);
  const fresh = items !== null && items.length === 0;
  const nothing =
    view !== null &&
    (view.kind === "dated" ? view.items.length === 0 : view.log.groups.length === 0);

  const sessionCount = sessions?.length;
  React.useEffect(() => {
    if (sessionCount !== undefined) void maybeAskForReview(sessionCount);
  }, [sessionCount]);

  const header = (
    <>
      <SetupStack cards={setupCards} total={2} />
    </>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={["top"]}>
      <ScreenHeader title={t("journal.log")} right={<AccountButton />} />
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
      {fresh ? (
        <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
          {header}
          <ClimbingEmpty />
        </ScrollView>
      ) : (
        <LogList
          view={view}
          header={header}
          below={
            <ActiveFilters
              pills={pills}
              onDrop={(pill) => setFilter({ ...pill.without, search: filter.search })}
              onClearAll={() => setFilter({ ...NO_LOG_FILTER, search: filter.search })}
            />
          }
          empty={
            nothing ? (
              <View
                style={{
                  marginTop: 40,
                  marginHorizontal: 18,
                  paddingVertical: 24,
                  paddingHorizontal: 10,
                }}
              >
                <Text style={{ ...emptyBody, color: colors.textSecondary }}>
                  {t("sessions.nothingMatches")}
                </Text>
              </View>
            ) : null
          }
          filtersActive={logFilterActive({ ...filter, search: "" })}
          onOpenFilters={() => setFiltersOpen(true)}
          search={{
            open: searching,
            text: filter.search,
            onOpen: () => setSearching(true),
            onChangeText: (search) => setFilter((f) => ({ ...f, search })),
            onCancel: () => {
              setSearching(false);
              setFilter((f) => ({ ...f, search: "" }));
            },
          }}
          onRefresh={() => Promise.all([log.reload(), climbs.reload()]).then(() => undefined)}
        />
      )}
      {items !== null && (
        <FilterSheet
          visible={filtersOpen}
          items={items}
          ctx={ctx}
          choices={choices}
          filter={filter}
          onApply={(next) => {
            setFilter(next);
            setFiltersOpen(false);
          }}
          onClose={() => setFiltersOpen(false)}
        />
      )}
      {!fresh && <LogFab />}
    </SafeAreaView>
  );
}
