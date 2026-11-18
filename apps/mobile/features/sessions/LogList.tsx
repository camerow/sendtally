import React from "react";
import { RefreshControl, SectionList, Text, View, type ViewToken } from "react-native";
import type { ClimbingSessionVM } from "@sendtally/features/climbs";
import type { LogItem, LogView } from "@sendtally/features/journal";
import { t } from "@sendtally/features/i18n";
import {
  logCountLabel,
  logYearGroups,
  monthKeyScopeItems,
  monthScopeItems,
  type ScopeItem,
} from "@sendtally/features/sessions";
import { colors, fonts } from "@sendtally/design/tokens";
import { CLIMB_ROW_HEIGHT } from "../climbs/ClimbLogRow";
import { entryRowHeight } from "../journal/EntryRow";
import { tripGroupHeight } from "../journal/TripGroup";
import { ACTIVITY_ROW_HEIGHT } from "./ActivityRow";
import { BLOCK_DONE_ROW_HEIGHT } from "./BlockDoneRow";
import { climbingSessionRowsHeight } from "./ClimbingSessionRows";
import { HANG_ROW_HEIGHT } from "./HangRow";
import { LogCell } from "./LogCell";
import { ScopeBar, type ScopeSearch } from "./ScopeBar";
import { SECTION_HEADER_HEIGHT, SectionHeader } from "./SectionHeader";
import { BLOCK_TAG_HEIGHT } from "./SessionRow";
import type { LogRow } from "./types";

/** `meta` is null on the per-climb list, whose groups are labelled lightly or not at all. */
type Section = { key: string; title: string | null; meta: string | null; data: LogRow[] };

type Layout = { length: number; offset: number };

const NO_CLIMBS: ReadonlyMap<string, ClimbingSessionVM> = new Map();

const blockLine = (item: LogItem): number => (item.blockTag === undefined ? 0 : BLOCK_TAG_HEIGHT);

function rowHeight(row: LogRow, nested: ReadonlyMap<string, ClimbingSessionVM>): number {
  if (row.type === "climb") return CLIMB_ROW_HEIGHT;
  if (row.type === "session")
    return climbingSessionRowsHeight(
      row.session,
      nested.get(row.session.fingerprint),
      row.blockTag
    );
  if (row.type === "hang") return HANG_ROW_HEIGHT + blockLine(row);
  if (row.type === "activity") return ACTIVITY_ROW_HEIGHT + blockLine(row);
  if (row.type === "block") return BLOCK_DONE_ROW_HEIGHT;
  return row.inside.length > 0 ? tripGroupHeight(row, nested) : entryRowHeight(row.entry);
}

/** Every header, row and footer's place in the dated list, worked out once per set of sections. */
function sectionLayouts(
  sections: readonly Section[],
  nested: ReadonlyMap<string, ClimbingSessionVM>,
  top: number
): Layout[] {
  const layouts: Layout[] = [];
  let offset = top;
  const add = (length: number): void => {
    layouts.push({ length, offset });
    offset += length;
  };
  for (const section of sections) {
    add(SECTION_HEADER_HEIGHT);
    section.data.forEach((row) => add(rowHeight(row, nested)));
    add(0);
  }
  return layouts;
}

function sectionsOf(view: LogView | null): { sections: Section[]; scope: ScopeItem[] } {
  if (view === null) return { sections: [], scope: [] };
  if (view.kind === "climbs") {
    const sections = view.log.groups.map((g) => ({
      key: g.key,
      title: g.label,
      meta: null,
      data: g.rows.map((row): LogRow => ({ type: "climb", key: `climb:${row.id}`, row })),
    }));
    return {
      sections,
      scope: monthKeyScopeItems(sections.map((s) => s.key).filter((k) => k !== "pinned")),
    };
  }
  const years = logYearGroups(view.items);
  return {
    sections: years.flatMap((year) =>
      year.months.map((m) => ({
        key: m.key,
        title: m.name,
        meta: t("sessions.monthMeta", { year: m.year, sessions: logCountLabel(m.items) }),
        data: m.items,
      }))
    ),
    scope: monthScopeItems(years),
  };
}

export type LogListProps = {
  view: LogView | null;
  header: React.ReactNode;
  /** Under the bar: the active filters. */
  below: React.ReactNode;
  empty: React.ReactNode;
  filtersActive: boolean;
  onOpenFilters: () => void;
  search: ScopeSearch;
  onRefresh: () => Promise<void>;
};

/** The Log by month, newest first, or one row per climb, under the bar that jumps, searches and filters it. */
export function LogList({
  view,
  header,
  below,
  empty,
  filtersActive,
  onOpenFilters,
  search,
  onRefresh,
}: LogListProps): React.ReactElement {
  const list = React.useRef<SectionList<LogRow, Section>>(null);
  const [refreshing, setRefreshing] = React.useState(false);
  const [currentKey, setCurrentKey] = React.useState<string | null>(null);
  const [headerHeight, setHeaderHeight] = React.useState(0);
  const nested = view?.kind === "dated" ? view.climbing : NO_CLIMBS;
  const flat = view?.kind === "climbs";
  const { sections, scope } = React.useMemo(() => sectionsOf(view), [view]);
  const layouts = React.useMemo(
    () => (flat ? null : sectionLayouts(sections, nested, headerHeight)),
    [flat, sections, nested, headerHeight]
  );
  const itemLayout = React.useMemo(
    () =>
      layouts === null
        ? undefined
        : (_: unknown, index: number) => ({
            ...(layouts[index] ?? { length: 0, offset: 0 }),
            index,
          }),
    [layouts]
  );

  const renderItem = React.useCallback(
    ({ item }: { item: LogRow }) => <LogCell item={item} nested={nested} />,
    [nested]
  );

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

  return (
    <>
      <ScopeBar
        items={scope}
        currentKey={currentKey ?? sections.find((s) => s.key !== "pinned")?.key ?? null}
        onSelect={jumpTo}
        filtersActive={filtersActive}
        onOpenFilters={onOpenFilters}
        search={search}
      />
      {below}
      <SectionList<LogRow, Section>
        ref={list}
        sections={sections}
        keyExtractor={(item) => item.key}
        stickySectionHeadersEnabled={!flat}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        getItemLayout={itemLayout}
        onScrollToIndexFailed={({ averageItemLength, index }) =>
          list.current?.getScrollResponder()?.scrollTo({ y: averageItemLength * index })
        }
        viewabilityConfigCallbackPairs={viewability}
        contentContainerStyle={{ paddingBottom: 140 }}
        ListHeaderComponent={
          <View onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}>{header}</View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void onRefresh().finally(() => setRefreshing(false));
            }}
            tintColor={colors.gunmetal}
          />
        }
        ListEmptyComponent={<>{empty}</>}
        renderSectionHeader={({ section }) =>
          section.meta !== null && section.title !== null ? (
            <SectionHeader title={section.title} meta={section.meta} />
          ) : section.title !== null ? (
            <Text
              accessibilityRole="header"
              style={{
                paddingHorizontal: 18,
                paddingTop: 6,
                paddingBottom: 2,
                fontFamily: fonts.monoMedium,
                fontSize: 11,
                letterSpacing: 0.9,
                textTransform: "uppercase",
                color: colors.textSecondary,
              }}
            >
              {section.title}
            </Text>
          ) : null
        }
        renderItem={renderItem}
      />
    </>
  );
}
