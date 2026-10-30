import React from "react";
import { RefreshControl, ScrollView, SectionList, Text, View } from "react-native";
import {
  CLIMB_STATUSES,
  climbLog,
  climbingSessionVM,
  gradeFilterLabel,
  useClimbs,
  type ClimbLogRowVM,
  type ClimbStatusFilter,
  type GradeFilter,
} from "@sendtally/features/climbs";
import { groupTrips, type LogItem } from "@sendtally/features/journal";
import { t, type MessageKey } from "@sendtally/features/i18n";
import { useGradeScalePrefs } from "@sendtally/features/settings";
import { logCountLabel, logYearGroups } from "@sendtally/features/sessions";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { Chip } from "../../components/Chip";
import { Icon } from "../../components/Icon";
import { TextInput } from "../../components/TextInput";
import { useApi } from "../../lib/api";
import { EntryRow } from "../journal/EntryRow";
import { TripGroup } from "../journal/TripGroup";
import { BlockDoneRow } from "../sessions/BlockDoneRow";
import { ClimbingSessionRows } from "../sessions/ClimbingSessionRows";
import { SectionHeader } from "../sessions/SectionHeader";
import { emptyBody, emptyLabel } from "../sessions/emptyStyles";
import { openLogItem } from "../sessions/openLogItem";
import { ClimbLogRow } from "./ClimbLogRow";
import { GradeFilterSheet } from "./GradeFilterSheet";

type Row = LogItem | { type: "climb"; key: string; row: ClimbLogRowVM };

/** `meta` is null on the flat climbs list, whose groups are labelled lightly or not at all. */
type Section = { key: string; title: string | null; meta: string | null; data: Row[] };

const STATUS_LABELS: Record<ClimbStatusFilter, MessageKey> = {
  all: "climbs.statusAll",
  projects: "climbs.statusProjects",
  sent: "climbs.statusSent",
  notYet: "climbs.statusNotYet",
};

const muted = {
  fontFamily: fonts.sans,
  fontSize: 14,
  lineHeight: 21,
  color: colors.textSecondary,
} as const;

export type ClimbingLogProps = {
  /** The climbing half of the log, null until it loads. */
  items: LogItem[] | null;
  header: React.ReactNode;
  onRefresh: () => Promise<void>;
};

/**
 * Climbing sessions by date with their climbs set in under them. Search, a grade range or a
 * status turns it into the flat list of every climb that matches.
 */
export function ClimbingLog({ items, header, onRefresh }: ClimbingLogProps): React.ReactElement {
  const api = useApi();
  const { state, reload } = useClimbs(api);
  const { scales } = useGradeScalePrefs(api);
  const [query, setQuery] = React.useState("");
  const [grade, setGrade] = React.useState<GradeFilter | null>(null);
  const [status, setStatus] = React.useState<ClimbStatusFilter>("all");
  const [picking, setPicking] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const ready = state.status === "ready" ? state.data : null;
  const filtered = query.trim() !== "" || grade !== null || status !== "all";
  const log = React.useMemo(
    () =>
      ready === null ? null : climbLog(ready.climbs, ready.sessions, { query, grade, status }),
    [ready, query, grade, status]
  );
  const nested = React.useMemo(
    () =>
      new Map(
        (ready?.sessions ?? []).map((s) => [
          s.fingerprint,
          climbingSessionVM(s, ready?.climbs ?? []),
        ])
      ),
    [ready]
  );

  const sections = React.useMemo((): Section[] => {
    if (filtered) {
      return (log?.groups ?? []).map((g) => ({
        key: g.key,
        title: g.label,
        meta: null,
        data: g.rows.map((row) => ({ type: "climb", key: `climb:${row.id}`, row })),
      }));
    }
    return logYearGroups(groupTrips(items ?? [])).flatMap((year) =>
      year.months.map((m) => ({
        key: m.key,
        title: m.name,
        meta: t("sessions.monthMeta", { year: m.year, sessions: logCountLabel(m.items) }),
        data: m.items,
      }))
    );
  }, [filtered, log, items]);

  const empty =
    filtered && ready !== null ? (
      <Text style={{ ...muted, padding: 18, textAlign: "center" }}>
        {ready.climbs.length === 0 ? t("climbs.empty") : t("climbs.noMatches")}
      </Text>
    ) : !filtered && items !== null ? (
      <View style={{ alignItems: "center", gap: 8, paddingHorizontal: 28, paddingTop: 44 }}>
        <Text style={emptyLabel}>{t("sessions.firstSessionLabel")}</Text>
        <Text style={emptyBody}>{t("sessions.firstSessionBody")}</Text>
      </View>
    ) : null;

  return (
    <>
      <SectionList<Row, Section>
        sections={sections}
        keyExtractor={(item) => item.key}
        stickySectionHeadersEnabled={!filtered}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 140 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void Promise.all([onRefresh(), reload()]).finally(() => setRefreshing(false));
            }}
            tintColor={colors.gunmetal}
          />
        }
        ListHeaderComponent={
          <>
            {header}
            <View style={{ gap: 10, paddingHorizontal: 18, paddingTop: 4, paddingBottom: 6 }}>
              <View
                style={{
                  minHeight: 50,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  paddingHorizontal: 14,
                  borderRadius: radius.control + 2,
                  backgroundColor: colors.surfaceSoft,
                }}
              >
                <Icon name="search" color={colors.textSecondary} size={18} strokeWidth={2} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  autoCorrect={false}
                  autoCapitalize="none"
                  placeholder={t("climbs.search")}
                  placeholderTextColor={colors.textFaint}
                  accessibilityLabel={t("climbs.search")}
                  style={{
                    flex: 1,
                    minHeight: 48,
                    fontFamily: fonts.sans,
                    fontSize: 15,
                    color: colors.gunmetal,
                  }}
                />
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                style={{ marginHorizontal: -18 }}
                contentContainerStyle={{ gap: 8, paddingHorizontal: 18 }}
              >
                <Chip
                  label={grade === null ? t("climbs.anyGrade") : gradeFilterLabel(grade)}
                  active={grade !== null}
                  uppercase={false}
                  icon="insights"
                  onPress={() => setPicking(true)}
                />
                {CLIMB_STATUSES.map((s) => (
                  <Chip
                    key={s}
                    label={t(STATUS_LABELS[s], { n: log?.counts[s] ?? 0 })}
                    active={s === status}
                    uppercase={false}
                    onPress={() => setStatus(s)}
                  />
                ))}
              </ScrollView>
              {state.status === "error" && (
                <Text style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.watermelonInk }}>
                  {t("climbs.loadFailed")}
                </Text>
              )}
            </View>
          </>
        }
        ListEmptyComponent={empty}
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
        renderItem={({ item }) =>
          item.type === "climb" ? (
            <View style={{ paddingHorizontal: 18 }}>
              <ClimbLogRow row={item.row} />
            </View>
          ) : item.type === "session" ? (
            <ClimbingSessionRows
              session={item.session}
              vm={nested.get(item.session.fingerprint)}
              blockTag={item.blockTag}
              onPress={() => openLogItem(item)}
            />
          ) : item.type === "block" ? (
            <BlockDoneRow recap={item.recap} onPress={() => openLogItem(item)} />
          ) : item.type === "entry" && item.inside.length > 0 ? (
            <TripGroup item={item} onOpen={openLogItem} climbing={nested} />
          ) : item.type === "entry" ? (
            <EntryRow entry={item.entry} onPress={() => openLogItem(item)} />
          ) : null
        }
      />
      <GradeFilterSheet
        visible={picking}
        value={grade}
        scales={scales}
        climbs={ready?.climbs ?? []}
        onChange={setGrade}
        onClose={() => setPicking(false)}
      />
    </>
  );
}
