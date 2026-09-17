import { router } from "expo-router";
import React from "react";
import {
  RefreshControl,
  SectionList,
  Text,
  View,
  type SectionListData,
  type ViewToken,
} from "react-native";
import { useSettings } from "@sendtally/features/settings";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  filterSessionsByTags,
  monthScopeItems,
  sessionTagGroups,
  sessionTagOptions,
  sessionTitle,
  logCountLabel,
  logYearGroups,
  tagScopeItems,
} from "@sendtally/features/sessions";
import { logItems, logScopeItems, type LogItem } from "@sendtally/features/journal";
import { t } from "@sendtally/features/i18n";
import { queries, useQueryPair } from "@sendtally/features/query";
import { colors, fonts } from "@sendtally/design/tokens";
import { ScreenHeader } from "../../components/ScreenHeader";
import { useClimbVocabulary } from "@sendtally/features/climbs";
import { useLiveSession, withTries } from "@sendtally/features/log-session";
import { sessionDraftStorage } from "../../lib/sessionDraftStorage";
import { useGradeScalePrefs } from "@sendtally/features/settings";
import { UpdateReadyCard } from "../../features/app-update/UpdateReadyCard";
import { EntryRow, entryRowHeight } from "../../features/journal/EntryRow";
import { LiveClimbEditor } from "../../features/live-session/LiveClimbEditor";
import { LiveSessionCard } from "../../features/live-session/LiveSessionCard";
import { LogFab } from "../../features/live-session/LogFab";
import {
  DEFAULT_FILTERS,
  FilterSheet,
  type SessionFilters,
} from "../../features/sessions/FilterSheet";
import { ScopeBar } from "../../features/sessions/ScopeBar";
import { SECTION_HEADER_HEIGHT, SectionHeader } from "../../features/sessions/SectionHeader";
import { SessionRow, sessionRowHeight } from "../../features/sessions/SessionRow";
import { SetupStack, type SetupCard } from "../../features/sessions/SetupStack";
import { useStravaConnect } from "../../features/settings/useStravaConnect";
import { useApi } from "../../lib/api";
import { maybeAskForReview } from "../../lib/review";
import { useSetupDismissed } from "../../lib/setupPrompt";
import { circuitGym, gymOfDraft, useGyms } from "@sendtally/features/gyms";

type Section = { key: string; title: string; meta: string; data: LogItem[] };

const rowHeight = (item: LogItem): number =>
  item.type === "session" ? sessionRowHeight(item.session) : entryRowHeight(item.entry);

function itemLayout(
  sections: ReadonlyArray<SectionListData<LogItem, Section>> | null,
  index: number
): { length: number; offset: number; index: number } {
  let offset = 0;
  let cursor = 0;
  for (const section of sections ?? []) {
    if (cursor === index) return { length: SECTION_HEADER_HEIGHT, offset, index };
    offset += SECTION_HEADER_HEIGHT;
    cursor += 1;
    for (const item of section.data) {
      const length = rowHeight(item);
      if (cursor === index) return { length, offset, index };
      offset += length;
      cursor += 1;
    }
    if (cursor === index) return { length: 0, offset, index };
    cursor += 1;
  }
  return { length: 0, offset, index };
}

const emptyLabel = {
  fontFamily: fonts.monoMedium,
  fontSize: 20,
  letterSpacing: 1.6,
  textTransform: "uppercase",
  color: colors.petalInk,
} as const;

const emptyBody = {
  textAlign: "center",
  fontFamily: fonts.sans,
  fontSize: 14,
  lineHeight: 21,
  color: colors.textSecondary,
} as const;

export default function Log(): React.ReactElement {
  const api = useApi();
  const list = React.useRef<SectionList<LogItem, Section>>(null);
  const log = useQueryPair(queries.sessions(api), queries.entries(api));
  const [sessions, entries] = log.state.status === "ready" ? log.state.data : [null, null];
  const error = log.state.status === "error" || log.refreshFailed ? t("sessions.loadFailed") : null;
  const [refreshing, setRefreshing] = React.useState(false);
  const [filters, setFilters] = React.useState<SessionFilters>(DEFAULT_FILTERS);
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [currentKey, setCurrentKey] = React.useState<string | null>(null);
  // ponytail: a second status() read per mount, to know if Strava is live; a Strava-status context across tabs if it ever matters
  const settings = useSettings(api);
  const { scales } = useGradeScalePrefs(api);
  const live = useLiveSession(sessionDraftStorage);
  const vocabulary = useClimbVocabulary(api);
  const [editingClimb, setEditingClimb] = React.useState<string | null>(null);
  const connect = useStravaConnect(api, settings.reload);
  const gyms = useGyms(api);
  const gymPrompt = useSetupDismissed("gym");
  const stravaPrompt = useSetupDismissed("strava");
  const liveGym = circuitGym(
    gymOfDraft(gyms.gyms, live.stored?.draft.gymId) ?? gyms.gyms[0] ?? null
  );
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

  const all = React.useMemo(() => logItems(sessions ?? [], entries ?? []), [sessions, entries]);
  const inScope = React.useMemo(() => logScopeItems(all, filters.scope), [all, filters.scope]);
  const tagOptions = React.useMemo(() => sessionTagOptions(inScope), [inScope]);
  const untaggedCount = React.useMemo(
    () => inScope.filter((i) => i.tags.length === 0).length,
    [inScope]
  );
  const visible = React.useMemo(
    () => filterSessionsByTags(inScope, filters.tags),
    [inScope, filters.tags]
  );

  const { sections, scopeItems } = React.useMemo(() => {
    if (filters.grouping === "tag") {
      const groups = sessionTagGroups(visible);
      return {
        sections: groups.map((g): Section => ({
          key: g.key,
          title: g.label,
          meta: logCountLabel(g.items),
          data: g.items,
        })),
        scopeItems: tagScopeItems(groups),
      };
    }
    const years = logYearGroups(visible);
    return {
      sections: years.flatMap((year) =>
        year.months.map((m): Section => ({
          key: m.key,
          title: m.name,
          meta: t("sessions.monthMeta", { year: m.year, sessions: logCountLabel(m.items) }),
          data: m.items,
        }))
      ),
      scopeItems: monthScopeItems(years),
    };
  }, [filters.grouping, visible]);

  const sessionCount = sessions?.length;
  React.useEffect(() => {
    if (sessionCount !== undefined) void maybeAskForReview(sessionCount);
  }, [sessionCount]);

  const viewability = React.useMemo(
    () => [
      {
        viewabilityConfig: { itemVisiblePercentThreshold: 40, minimumViewTime: 40 },
        onViewableItemsChanged: ({ viewableItems }: { viewableItems: ViewToken[] }) => {
          const first = viewableItems.find((token) => token.section !== undefined);
          const section: unknown = first?.section;
          if (typeof section === "object" && section !== null && "key" in section) {
            setCurrentKey(String(section.key));
          }
        },
      },
    ],
    []
  );

  const jumpTo = (sectionKey: string): void => {
    const sectionIndex = sections.findIndex((s) => s.key === sectionKey);
    if (sectionIndex < 0) return;
    setCurrentKey(sectionKey);
    list.current?.scrollToLocation({ sectionIndex, itemIndex: 0, animated: true });
  };

  const applyFilters = (next: SessionFilters): void => {
    setFilters(next);
    setFiltersOpen(false);
    list.current?.scrollToLocation({ sectionIndex: 0, itemIndex: 0, animated: false });
  };

  const filtersActive =
    filters.tags.length > 0 || filters.grouping === "tag" || filters.scope !== "all";
  const caption = sessions === null ? t("common.loading") : logCountLabel(visible);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={["top"]}>
      <ScreenHeader title={t("journal.log")} caption={caption} />
      {sections.length > 0 && (
        <ScopeBar
          items={scopeItems}
          currentKey={currentKey ?? sections[0]?.key ?? null}
          onSelect={jumpTo}
          filtersActive={filtersActive}
          onOpenFilters={() => setFiltersOpen(true)}
        />
      )}
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
      <SectionList
        ref={list}
        sections={sections}
        keyExtractor={(item) => item.key}
        stickySectionHeadersEnabled
        getItemLayout={itemLayout}
        viewabilityConfigCallbackPairs={viewability}
        contentContainerStyle={{ paddingBottom: 140 }}
        ListHeaderComponent={
          <>
            <UpdateReadyCard liveSession={live.stored !== null} />
            <SetupStack cards={setupCards} total={2} />
            {live.stored !== null && (
              <LiveSessionCard
                stored={live.stored}
                vocabulary={vocabulary}
                gym={liveGym}
                onEditClimb={setEditingClimb}
                onChangeTries={(key, tries) => live.updateClimb(key, (c) => withTries(c, tries))}
              />
            )}
          </>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void log.reload().finally(() => setRefreshing(false));
            }}
            tintColor={colors.gunmetal}
          />
        }
        ListEmptyComponent={
          sessions === null ? null : inScope.length === 0 && filters.scope === "journal" ? (
            <View style={{ alignItems: "center", gap: 8, paddingHorizontal: 28, paddingTop: 44 }}>
              <Text style={emptyLabel}>{t("journal.emptyTitle")}</Text>
              <Text style={emptyBody}>{t("journal.emptyBody")}</Text>
            </View>
          ) : inScope.length === 0 ? (
            <View style={{ alignItems: "center", gap: 8, paddingHorizontal: 28, paddingTop: 44 }}>
              <Text style={emptyLabel}>{t("sessions.firstSessionLabel")}</Text>
              <Text style={emptyBody}>{t("sessions.firstSessionBody")}</Text>
            </View>
          ) : (
            <Text
              style={{
                padding: 28,
                textAlign: "center",
                fontFamily: fonts.mono,
                fontSize: 13,
                lineHeight: 20,
                color: colors.textMuted,
              }}
            >
              {t("sessions.noneForTags")}
            </Text>
          )
        }
        renderSectionHeader={({ section }) => (
          <SectionHeader title={section.title} meta={section.meta} />
        )}
        renderItem={({ item }) =>
          item.type === "session" ? (
            <SessionRow
              session={item.session}
              title={sessionTitle(item.session)}
              onPress={() =>
                router.push({
                  pathname: "/session/[fingerprint]",
                  params: { fingerprint: item.session.fingerprint },
                })
              }
            />
          ) : (
            <EntryRow
              entry={item.entry}
              onPress={() =>
                router.push({ pathname: "/journal/[id]", params: { id: item.entry.id } })
              }
            />
          )
        }
      />
      <LogFab onLogClimb={() => setEditingClimb(live.addClimb(scales, liveGym))} />
      <LiveClimbEditor
        live={live}
        vocabulary={vocabulary}
        gym={liveGym}
        editingKey={editingClimb}
        onClose={() => setEditingClimb(null)}
      />
      <FilterSheet
        visible={filtersOpen}
        items={all}
        tagOptions={tagOptions}
        untaggedCount={untaggedCount}
        filters={filters}
        onApply={applyFilters}
        onClose={() => setFiltersOpen(false)}
      />
    </SafeAreaView>
  );
}
