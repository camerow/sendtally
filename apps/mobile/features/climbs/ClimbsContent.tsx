import { router } from "expo-router";
import React from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import {
  CLIMB_STATUSES,
  climbLog,
  gradeFilterLabel,
  useClimbs,
  type ClimbStatusFilter,
  type GradeFilter,
} from "@sendtally/features/climbs";
import { t, type MessageKey } from "@sendtally/features/i18n";
import { useGradeScalePrefs } from "@sendtally/features/settings";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { Chip } from "../../components/Chip";
import { Fab } from "../../components/Fab";
import { Icon } from "../../components/Icon";
import { InsightsLink } from "../../components/InsightsLink";
import { TextInput } from "../../components/TextInput";
import { useApi } from "../../lib/api";
import { ClimbLogRow } from "./ClimbLogRow";
import { GradeFilterSheet } from "./GradeFilterSheet";

export type ClimbsContentProps = { header?: React.ReactNode };

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

/** Every climb in one log: search, a grade range and how it went narrow it. */
export function ClimbsContent({ header }: ClimbsContentProps): React.ReactElement {
  const api = useApi();
  const { state, reload } = useClimbs(api);
  const { scales } = useGradeScalePrefs(api);
  const [query, setQuery] = React.useState("");
  const [grade, setGrade] = React.useState<GradeFilter | null>(null);
  const [status, setStatus] = React.useState<ClimbStatusFilter>("all");
  const [picking, setPicking] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const ready = state.status === "ready" ? state.data : null;
  const log = React.useMemo(
    () =>
      ready === null ? null : climbLog(ready.climbs, ready.sessions, { query, grade, status }),
    [ready, query, grade, status]
  );

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 96 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void reload().finally(() => setRefreshing(false));
            }}
            tintColor={colors.gunmetal}
          />
        }
      >
        {header}
        <View style={{ paddingTop: 14 }}>
          <InsightsLink
            title={t("climbs.climbingInsights")}
            onPress={() => router.push("/climbing-insights")}
          />
        </View>
        <View style={{ gap: 10, paddingHorizontal: 18, paddingTop: 2 }}>
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
            style={{ marginHorizontal: -18 }}
            contentContainerStyle={{ gap: 8, paddingHorizontal: 18 }}
          >
            <Chip
              label={grade === null ? t("climbs.anyGrade") : gradeFilterLabel(grade)}
              active={grade !== null}
              uppercase={false}
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
          {log !== null && ready !== null && ready.climbs.length === 0 && (
            <Text style={{ ...muted, padding: 18, textAlign: "center" }}>{t("climbs.empty")}</Text>
          )}
          {log !== null && ready !== null && ready.climbs.length > 0 && log.groups.length === 0 && (
            <Text style={{ ...muted, padding: 18, textAlign: "center" }}>
              {t("climbs.noMatches")}
            </Text>
          )}
          {log?.groups.map((g) => (
            <View key={g.key}>
              {g.label !== null && (
                <Text
                  accessibilityRole="header"
                  style={{
                    paddingTop: 6,
                    paddingBottom: 2,
                    fontFamily: fonts.monoMedium,
                    fontSize: 11,
                    letterSpacing: 0.9,
                    textTransform: "uppercase",
                    color: colors.textSecondary,
                  }}
                >
                  {g.label}
                </Text>
              )}
              {g.rows.map((row) => (
                <ClimbLogRow key={row.id} row={row} />
              ))}
            </View>
          ))}
        </View>
      </ScrollView>

      <Fab label={t("climbs.addClimb")} onPress={() => router.push("/climb/log")} />
      <GradeFilterSheet
        visible={picking}
        value={grade}
        scales={scales}
        climbs={ready?.climbs ?? []}
        onChange={setGrade}
        onClose={() => setPicking(false)}
      />
    </View>
  );
}
