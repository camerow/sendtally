import React from "react";
import { ActivityIndicator, Text, View } from "react-native";
import {
  CLIMB_PLACES,
  climbingInsightsVM,
  daysClimbed,
  mainDiscipline,
  useClimbs,
  workoutClimbSessions,
  type ClimbPlaceFilter,
} from "@sendtally/features/climbs";
import { t } from "@sendtally/features/i18n";
import { disciplineLabel, type Discipline } from "@sendtally/features/log-session";
import { useGradeScalePrefs } from "@sendtally/features/settings";
import type { TrendRange } from "@sendtally/features/trends";
import { colors, fonts } from "@sendtally/design/tokens";
import { Pyramid } from "../../components/Pyramid";
import { PyramidLegend } from "../../components/PyramidLegend";
import { Segmented } from "../../components/Segmented";
import { useApi } from "../../lib/api";
import { CountTile } from "./CountTile";
import { DaysClimbing } from "./DaysClimbing";
import { GradeBadge } from "./GradeBadge";
import { sectionLabel } from "./sectionLabel";

const PLACE_LABELS: Record<ClimbPlaceFilter, () => string> = {
  all: () => t("trends.scopeAll"),
  outdoor: () => t("trends.outside"),
  indoor: () => t("climbs.gym"),
};

/**
 * The pyramid of what was sent, the average send, sends, flashes and projects, the days
 * climbed and the top send, counting the climbs workouts logged on the tally alongside the
 * sessions.
 */
export function ClimbingInsights({ range }: { range: TrendRange }): React.ReactElement {
  const api = useApi();
  const { state } = useClimbs(api);
  const boulderScale = useGradeScalePrefs(api).scales.boulder === "font" ? "font" : "v";
  const [discipline, setDiscipline] = React.useState<Discipline | null>(null);
  const [place, setPlace] = React.useState<ClimbPlaceFilter>("all");
  const ready = state.status === "ready" ? state.data : null;
  const sessions = React.useMemo(
    () => (ready === null ? [] : [...ready.sessions, ...workoutClimbSessions(ready.activities)]),
    [ready]
  );
  const shownDiscipline = discipline ?? mainDiscipline(sessions);
  const vm = React.useMemo(
    () =>
      ready === null
        ? null
        : climbingInsightsVM(sessions, ready.climbs, {
            range,
            discipline: shownDiscipline,
            place,
            boulderScale,
          }),
    [ready, sessions, range, shownDiscipline, place, boulderScale]
  );
  const days = React.useMemo(() => daysClimbed(sessions, range), [sessions, range]);

  return (
    <>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Segmented
            soft
            label={t("climbs.discipline")}
            segments={(["boulder", "route"] as const).map((d) => ({
              key: d,
              label: disciplineLabel(d),
              on: d === shownDiscipline,
              onPress: () => setDiscipline(d),
            }))}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Segmented
            soft
            label={t("climbs.where")}
            segments={CLIMB_PLACES.map((p) => ({
              key: p,
              label: PLACE_LABELS[p](),
              on: p === place,
              onPress: () => setPlace(p),
            }))}
          />
        </View>
      </View>
      {vm === null ? (
        state.status === "error" ? (
          <Text style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.watermelonInk }}>
            {t("climbs.loadFailed")}
          </Text>
        ) : (
          <ActivityIndicator color={colors.gunmetal} style={{ alignSelf: "flex-start" }} />
        )
      ) : (
        <>
          <View
            style={{
              gap: 8,
              padding: 14,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.lineOnLight,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Text accessibilityRole="header" style={sectionLabel}>
                {t("climbs.sendsByGrade")}
              </Text>
              <PyramidLegend inner={t("common.sent")} outer={t("sessionDetail.notYet")} />
            </View>
            {vm.pyramid.length === 0 ? (
              <Text style={{ fontFamily: fonts.sans, fontSize: 14, color: colors.textSecondary }}>
                {t("climbs.insightsEmpty")}
              </Text>
            ) : (
              <Pyramid
                rows={vm.pyramid}
                label={vm.pyramid.map((r) => `${r.gradeLabel}: ${r.countLabel}`).join(". ")}
              />
            )}
          </View>
          <View style={{ flexDirection: "row", gap: 6 }}>
            <CountTile value={vm.avgSend ?? "–"} label={t("climbs.avgSendWord")} />
            <CountTile value={vm.sends} label={t("climbs.sendsWord", { count: vm.sends })} />
            <CountTile value={vm.flashed} label={t("climbs.flashedWord")} />
            <CountTile
              value={vm.projects}
              label={t("climbs.projectsWord", { count: vm.projects })}
            />
          </View>
          <DaysClimbing vm={days} />
          {vm.hardest !== null && (
            <View
              style={{
                minHeight: 52,
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                borderBottomWidth: 1,
                borderBottomColor: colors.lineOnLightSoft,
              }}
            >
              <GradeBadge label={vm.hardest.gradeLabel} />
              <Text
                numberOfLines={1}
                style={{
                  flex: 1,
                  fontFamily: fonts.sansSemiBold,
                  fontSize: 14.5,
                  color: colors.gunmetal,
                }}
              >
                {vm.hardest.name ?? t("climbs.hardestSend")}
              </Text>
              <Text style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.textSecondary }}>
                {t("climbs.hardestOn", { date: vm.hardest.dateLabel })}
              </Text>
            </View>
          )}
        </>
      )}
    </>
  );
}
