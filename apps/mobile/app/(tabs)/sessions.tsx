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
import { SafeAreaView } from "react-native-safe-area-context";
import type { SessionRow as SessionRowData } from "@sendtally/api-client";
import {
  countLabel,
  filterSessionsByTags,
  monthScopeItems,
  sessionBadge,
  sessionTagGroups,
  sessionTagOptions,
  sessionTitle,
  sessionYearGroups,
  tagScopeItems,
} from "@sendtally/features/sessions";
import { colors, fonts } from "@sendtally/design/tokens";
import { LogoMark } from "../../components/Logo";
import { FilterSheet, type SessionFilters } from "../../features/sessions/FilterSheet";
import { LogSessionFab } from "../../features/sessions/LogSessionFab";
import { ScopeBar } from "../../features/sessions/ScopeBar";
import { SECTION_HEADER_HEIGHT, SectionHeader } from "../../features/sessions/SectionHeader";
import { SessionRow, sessionRowHeight } from "../../features/sessions/SessionRow";
import { useApi } from "../../lib/api";

type Section = { key: string; title: string; meta: string; data: SessionRowData[] };

const HEADER_HEIGHT = 44;

function itemLayout(
  sections: ReadonlyArray<SectionListData<SessionRowData, Section>> | null,
  index: number
): { length: number; offset: number; index: number } {
  let offset = HEADER_HEIGHT;
  let cursor = 0;
  for (const section of sections ?? []) {
    if (cursor === index) return { length: SECTION_HEADER_HEIGHT, offset, index };
    offset += SECTION_HEADER_HEIGHT;
    cursor += 1;
    for (const session of section.data) {
      const length = sessionRowHeight(session);
      if (cursor === index) return { length, offset, index };
      offset += length;
      cursor += 1;
    }
    if (cursor === index) return { length: 0, offset, index };
    cursor += 1;
  }
  return { length: 0, offset, index };
}

export default function Sessions(): React.ReactElement {
  const api = useApi();
  const list = React.useRef<SectionList<SessionRowData, Section>>(null);
  const [sessions, setSessions] = React.useState<SessionRowData[] | null>(null);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [filters, setFilters] = React.useState<SessionFilters>({ grouping: "month", tags: [] });
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [currentKey, setCurrentKey] = React.useState<string | null>(null);

  const all = React.useMemo(() => sessions ?? [], [sessions]);
  const tagOptions = React.useMemo(() => sessionTagOptions(all), [all]);
  const untaggedCount = React.useMemo(() => all.filter((s) => s.tags.length === 0).length, [all]);
  const visible = React.useMemo(() => filterSessionsByTags(all, filters.tags), [all, filters.tags]);

  const { sections, scopeItems } = React.useMemo(() => {
    if (filters.grouping === "tag") {
      const groups = sessionTagGroups(visible);
      return {
        sections: groups.map((g): Section => ({
          key: g.key,
          title: g.label,
          meta: countLabel(g.sessions.length),
          data: g.sessions,
        })),
        scopeItems: tagScopeItems(groups),
      };
    }
    const years = sessionYearGroups(visible);
    return {
      sections: years.flatMap((year) =>
        year.months.map((m): Section => ({
          key: m.key,
          title: m.name,
          meta: `${m.year} · ${countLabel(m.sessions.length)}`,
          data: m.sessions,
        }))
      ),
      scopeItems: monthScopeItems(years),
    };
  }, [filters.grouping, visible]);

  const load = React.useCallback(async (): Promise<void> => {
    try {
      const result = await api.sessions();
      setSessions(result.sessions);
      setError(null);
    } catch {
      setError("Could not reach sendtally. Pull to retry.");
    }
  }, [api]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const viewability = React.useRef([
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
  ]);

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

  const filtersActive = filters.tags.length > 0 || filters.grouping === "tag";
  const caption = sessions === null ? "LOADING…" : countLabel(visible.length);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={["top"]}>
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
        keyExtractor={(s) => s.fingerprint}
        stickySectionHeadersEnabled
        getItemLayout={itemLayout}
        viewabilityConfigCallbackPairs={viewability.current}
        contentContainerStyle={{ paddingBottom: 96 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load().finally(() => setRefreshing(false));
            }}
            tintColor={colors.gunmetal}
          />
        }
        ListHeaderComponent={
          <View
            style={{
              height: HEADER_HEIGHT,
              flexDirection: "row",
              alignItems: "center",
              gap: 9,
              paddingHorizontal: 18,
            }}
          >
            <LogoMark size={22} />
            <Text
              style={{
                fontFamily: fonts.display,
                fontSize: 22,
                letterSpacing: -0.5,
                color: colors.gunmetal,
              }}
            >
              Sessions
            </Text>
            <View style={{ flex: 1 }} />
            <Text
              style={{
                fontFamily: fonts.monoMedium,
                fontSize: 10,
                letterSpacing: 0.8,
                color: colors.textMuted,
              }}
            >
              {caption}
            </Text>
          </View>
        }
        ListEmptyComponent={
          sessions !== null ? (
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
              {all.length === 0
                ? "No sessions yet. Hit Log a session and your first one takes about a minute."
                : "No sessions carry those tags."}
            </Text>
          ) : null
        }
        renderSectionHeader={({ section }) => (
          <SectionHeader title={section.title} meta={section.meta} />
        )}
        renderItem={({ item }) => (
          <SessionRow
            session={item}
            title={sessionTitle(item)}
            badge={sessionBadge(item)}
            onPress={() =>
              router.push({
                pathname: "/session/[fingerprint]",
                params: { fingerprint: item.fingerprint },
              })
            }
          />
        )}
      />
      <LogSessionFab />
      <FilterSheet
        visible={filtersOpen}
        sessions={all}
        tagOptions={tagOptions}
        untaggedCount={untaggedCount}
        filters={filters}
        onApply={applyFilters}
        onClose={() => setFiltersOpen(false)}
      />
    </SafeAreaView>
  );
}
