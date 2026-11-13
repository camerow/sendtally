import React from "react";
import { RefreshControl, SectionList, Text, View, type ViewToken } from "react-native";
import { monthScopeItems, logCountLabel, logYearGroups } from "@sendtally/features/sessions";
import { logWorkoutName, trainingLogItems, type LogItem } from "@sendtally/features/journal";
import { t } from "@sendtally/features/i18n";
import { colors } from "@sendtally/design/tokens";
import { entryRowHeight } from "../journal/EntryRow";
import { DEFAULT_FILTERS, FilterSheet, type SessionFilters } from "./FilterSheet";
import { ScopeBar } from "./ScopeBar";
import { SECTION_HEADER_HEIGHT, SectionHeader } from "./SectionHeader";
import { ACTIVITY_ROW_HEIGHT } from "./ActivityRow";
import { HANG_ROW_HEIGHT } from "./HangRow";
import { BLOCK_TAG_HEIGHT } from "./SessionRow";
import { BLOCK_DONE_ROW_HEIGHT } from "./BlockDoneRow";
import { emptyBody, emptyLabel } from "./emptyStyles";
import { TrainingEmpty } from "./TrainingEmpty";
import { TrainingLogCell } from "./TrainingLogCell";
import { WorkoutFilterBar } from "./WorkoutFilterBar";

type Section = { key: string; title: string; meta: string; data: LogItem[] };

const blockLine = (item: LogItem): number => (item.blockTag === undefined ? 0 : BLOCK_TAG_HEIGHT);

const rowHeight = (item: LogItem): number => {
  if (item.type === "session") return 0;
  if (item.type === "hang") return HANG_ROW_HEIGHT + blockLine(item);
  if (item.type === "activity") return ACTIVITY_ROW_HEIGHT + blockLine(item);
  if (item.type === "block") return BLOCK_DONE_ROW_HEIGHT;
  return entryRowHeight(item.entry);
};

/** Every header, row and footer's place in the list, worked out once per set of sections. */
function sectionLayouts(sections: readonly Section[]): { length: number; offset: number }[] {
  const layouts: { length: number; offset: number }[] = [];
  let offset = 0;
  const add = (length: number): void => {
    layouts.push({ length, offset });
    offset += length;
  };
  for (const section of sections) {
    add(SECTION_HEADER_HEIGHT);
    section.data.forEach((item) => add(rowHeight(item)));
    add(0);
  }
  return layouts;
}

const renderItem = ({ item }: { item: LogItem }): React.ReactElement => (
  <TrainingLogCell item={item} />
);

export type TrainingLogProps = {
  /** The training half of the log, null until it loads. */
  items: LogItem[] | null;
  header: React.ReactNode;
  onRefresh: () => Promise<void>;
  /** One workout's key to narrow to, from a Stats link. */
  workout?: string | null;
  onClearWorkout?: () => void;
};

/** Workouts, hangs and other training by month, with the journal between them. */
export function TrainingLog({
  items,
  header,
  onRefresh,
  workout = null,
  onClearWorkout,
}: TrainingLogProps): React.ReactElement {
  const list = React.useRef<SectionList<LogItem, Section>>(null);
  const [refreshing, setRefreshing] = React.useState(false);
  const [filters, setFilters] = React.useState<SessionFilters>(DEFAULT_FILTERS);
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [currentKey, setCurrentKey] = React.useState<string | null>(null);
  const all = React.useMemo(() => items ?? [], [items]);

  const inScope = React.useMemo(
    () => trainingLogItems(all, filters.scope, workout),
    [all, filters.scope, workout]
  );
  const workoutName = React.useMemo(() => logWorkoutName(all, workout), [all, workout]);

  const { sections, scopeItems } = React.useMemo(() => {
    const years = logYearGroups(inScope);
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
  }, [inScope]);

  const layouts = React.useMemo(() => sectionLayouts(sections), [sections]);
  const itemLayout = React.useCallback(
    (_: unknown, index: number) => ({ ...(layouts[index] ?? { length: 0, offset: 0 }), index }),
    [layouts]
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

  const applyFilters = (next: SessionFilters): void => {
    setFilters(next);
    setFiltersOpen(false);
    list.current?.scrollToLocation({ sectionIndex: 0, itemIndex: 0, animated: false });
  };

  const filtersActive = filters.scope !== "all" || workout !== null;

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
      {workoutName !== null && (
        <WorkoutFilterBar name={workoutName} onClear={() => onClearWorkout?.()} />
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
          items === null || inScope.length > 0 ? null : all.length === 0 && workout === null ? (
            <TrainingEmpty />
          ) : filters.scope === "journal" ? (
            <View style={{ alignItems: "center", gap: 8, paddingHorizontal: 28, paddingTop: 44 }}>
              <Text style={emptyLabel}>{t("journal.emptyTitle")}</Text>
              <Text style={emptyBody}>{t("journal.emptyBody")}</Text>
            </View>
          ) : (
            <View style={{ alignItems: "center", gap: 8, paddingHorizontal: 28, paddingTop: 44 }}>
              <Text style={emptyLabel}>{t("training.logEmptyTitle")}</Text>
              <Text style={emptyBody}>{t("training.logEmptyBody")}</Text>
            </View>
          )
        }
        renderSectionHeader={({ section }) => (
          <SectionHeader title={section.title} meta={section.meta} />
        )}
        renderItem={renderItem}
      />
      <FilterSheet
        visible={filtersOpen}
        items={all}
        filters={filters}
        onApply={applyFilters}
        onClose={() => setFiltersOpen(false)}
      />
    </>
  );
}
