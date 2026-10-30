import React from "react";
import {
  RefreshControl,
  SectionList,
  Text,
  View,
  type SectionListData,
  type ViewToken,
} from "react-native";
import {
  filterSessionsByTags,
  monthScopeItems,
  sessionTagGroups,
  sessionTagOptions,
  logCountLabel,
  logYearGroups,
  tagScopeItems,
} from "@sendtally/features/sessions";
import { groupTrips, logScopeItems, type LogItem } from "@sendtally/features/journal";
import { t } from "@sendtally/features/i18n";
import { colors, fonts } from "@sendtally/design/tokens";
import { EntryRow, entryRowHeight } from "../journal/EntryRow";
import { TripGroup, tripGroupHeight } from "../journal/TripGroup";
import { DEFAULT_FILTERS, FilterSheet, type SessionFilters } from "./FilterSheet";
import { ScopeBar } from "./ScopeBar";
import { SECTION_HEADER_HEIGHT, SectionHeader } from "./SectionHeader";
import { ACTIVITY_ROW_HEIGHT, ActivityRow } from "./ActivityRow";
import { HANG_ROW_HEIGHT, HangRow } from "./HangRow";
import { BLOCK_TAG_HEIGHT } from "./SessionRow";
import { BLOCK_DONE_ROW_HEIGHT, BlockDoneRow } from "./BlockDoneRow";
import { emptyBody, emptyLabel } from "./emptyStyles";
import { openLogItem } from "./openLogItem";

type Section = { key: string; title: string; meta: string; data: LogItem[] };

const blockLine = (item: LogItem): number => (item.blockTag === undefined ? 0 : BLOCK_TAG_HEIGHT);

const rowHeight = (item: LogItem): number => {
  if (item.type === "session") return 0;
  if (item.type === "hang") return HANG_ROW_HEIGHT + blockLine(item);
  if (item.type === "activity") return ACTIVITY_ROW_HEIGHT + blockLine(item);
  if (item.type === "block") return BLOCK_DONE_ROW_HEIGHT;
  return item.inside.length > 0 ? tripGroupHeight(item) : entryRowHeight(item.entry);
};

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

export type TrainingLogProps = {
  /** The training half of the log, null until it loads. */
  items: LogItem[] | null;
  header: React.ReactNode;
  onRefresh: () => Promise<void>;
};

/** Workouts, hangs and other training by month, with the journal between them. */
export function TrainingLog({ items, header, onRefresh }: TrainingLogProps): React.ReactElement {
  const list = React.useRef<SectionList<LogItem, Section>>(null);
  const [refreshing, setRefreshing] = React.useState(false);
  const [filters, setFilters] = React.useState<SessionFilters>(DEFAULT_FILTERS);
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [currentKey, setCurrentKey] = React.useState<string | null>(null);
  const all = React.useMemo(() => items ?? [], [items]);

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
    const years = logYearGroups(filters.scope === "all" ? groupTrips(visible) : visible);
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
  }, [filters.grouping, filters.scope, visible]);

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

  return (
    <>
      {sections.length > 0 && (
        <ScopeBar
          items={scopeItems}
          currentKey={currentKey ?? sections[0]?.key ?? null}
          onSelect={jumpTo}
          filtersActive={filtersActive}
          onOpenFilters={() => setFiltersOpen(true)}
        />
      )}
      <SectionList
        ref={list}
        sections={sections}
        keyExtractor={(item) => item.key}
        stickySectionHeadersEnabled
        getItemLayout={itemLayout}
        viewabilityConfigCallbackPairs={viewability}
        contentContainerStyle={{ paddingBottom: 140 }}
        ListHeaderComponent={<>{header}</>}
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
        ListEmptyComponent={
          items === null ? null : inScope.length === 0 && filters.scope === "journal" ? (
            <View style={{ alignItems: "center", gap: 8, paddingHorizontal: 28, paddingTop: 44 }}>
              <Text style={emptyLabel}>{t("journal.emptyTitle")}</Text>
              <Text style={emptyBody}>{t("journal.emptyBody")}</Text>
            </View>
          ) : inScope.length === 0 ? (
            <View style={{ alignItems: "center", gap: 8, paddingHorizontal: 28, paddingTop: 44 }}>
              <Text style={emptyLabel}>{t("training.logEmptyTitle")}</Text>
              <Text style={emptyBody}>{t("training.logEmptyBody")}</Text>
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
          item.type === "session" ? null : item.type === "hang" ? (
            <HangRow hang={item.hang} blockTag={item.blockTag} onPress={() => openLogItem(item)} />
          ) : item.type === "activity" ? (
            <ActivityRow
              activity={item.activity}
              blockTag={item.blockTag}
              onPress={() => openLogItem(item)}
            />
          ) : item.type === "block" ? (
            <BlockDoneRow recap={item.recap} onPress={() => openLogItem(item)} />
          ) : item.inside.length > 0 ? (
            <TripGroup item={item} onOpen={openLogItem} />
          ) : (
            <EntryRow entry={item.entry} onPress={() => openLogItem(item)} />
          )
        }
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
    </>
  );
}
