import { router } from "expo-router";
import React from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { climbsOverview, useClimbs, type ClimbRowVM } from "@sendtally/features/climbs";
import { disciplineLabel, type Discipline } from "@sendtally/features/log-session";
import { t } from "@sendtally/features/i18n";
import { colors, fonts } from "@sendtally/design/tokens";
import { Fab } from "../../components/Fab";
import { Pyramid } from "../../components/Pyramid";
import { PyramidLegend } from "../../components/PyramidLegend";
import { Segmented } from "../../components/Segmented";
import { useApi } from "../../lib/api";
import { useCanSeeInsights } from "../billing/useBilling";
import { ClimbListRow } from "./ClimbListRow";
import { StatTile } from "./StatTile";

export type ClimbsContentProps = { header?: React.ReactNode };

const sectionLabel = {
  paddingVertical: 4,
  fontFamily: fonts.monoMedium,
  fontSize: 11,
  letterSpacing: 0.9,
  textTransform: "uppercase",
  color: colors.gunmetal,
} as const;

function Section({
  title,
  rows,
}: {
  title: string;
  rows: ClimbRowVM[];
}): React.ReactElement | null {
  if (rows.length === 0) return null;
  return (
    <View>
      <Text accessibilityRole="header" style={sectionLabel}>
        {title}
      </Text>
      {rows.map((r) => (
        <ClimbListRow
          key={r.id}
          gradeLabel={r.gradeLabel}
          name={r.name}
          meta={r.meta}
          onPress={() => router.push({ pathname: "/climb/[id]", params: { id: r.id } })}
        />
      ))}
    </View>
  );
}

/** Named climbs, mostly outside: days out, the hardest send, the outdoor pyramid, then each climb. */
export function ClimbsContent({ header }: ClimbsContentProps): React.ReactElement {
  const api = useApi();
  const { state, reload } = useClimbs(api);
  const allTime = useCanSeeInsights() === true;
  const [picked, setPicked] = React.useState<Discipline>("boulder");
  const [refreshing, setRefreshing] = React.useState(false);
  const ready = state.status === "ready" ? state.data : null;
  const overview = React.useMemo(() => {
    if (ready === null) return null;
    const first = climbsOverview(ready.climbs, ready.sessions, picked, allTime);
    const only = first.disciplines.length === 1 ? first.disciplines[0] : undefined;
    return only === undefined || only === picked
      ? first
      : climbsOverview(ready.climbs, ready.sessions, only, allTime);
  }, [ready, picked, allTime]);
  const discipline =
    overview?.disciplines.length === 1 ? (overview.disciplines[0] ?? picked) : picked;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
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
        {state.status === "error" && (
          <Text
            style={{
              paddingHorizontal: 18,
              fontFamily: fonts.mono,
              fontSize: 12,
              color: colors.watermelonInk,
            }}
          >
            {t("climbs.loadFailed")}
          </Text>
        )}
        {overview !== null && (
          <View style={{ gap: 14, paddingHorizontal: 18, paddingTop: 8 }}>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <StatTile
                label={t("climbs.daysOutside")}
                value={String(overview.daysOutside)}
                detail={t("climbs.lastYear", { count: overview.daysOutsideLastYear })}
              />
              <StatTile
                label={t("climbs.hardestSend")}
                value={overview.hardest?.gradeLabel ?? "-"}
                detail={
                  overview.hardest === null
                    ? t("climbs.noSendsYet")
                    : t("climbs.sentOn", { date: overview.hardest.dateLabel })
                }
              />
            </View>

            {overview.pyramid.length > 0 && (
              <View
                style={{
                  gap: 8,
                  padding: 14,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: "rgba(64,63,76,0.12)",
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                >
                  {overview.disciplines.length > 1 ? (
                    <View style={{ width: 160 }}>
                      <Segmented
                        soft
                        label={t("climbs.discipline")}
                        segments={(["boulder", "route"] as const).map((d) => ({
                          key: d,
                          label: disciplineLabel(d),
                          on: d === discipline,
                          onPress: () => setPicked(d),
                        }))}
                      />
                    </View>
                  ) : (
                    <Text style={sectionLabel}>{t("climbs.outdoorSends")}</Text>
                  )}
                  {allTime ? (
                    <PyramidLegend inner={t("climbs.thisYear")} outer={t("climbs.before")} />
                  ) : (
                    <Text
                      style={{
                        fontFamily: fonts.sans,
                        fontSize: 11.5,
                        color: colors.textSecondary,
                      }}
                    >
                      {t("climbs.thisYear")}
                    </Text>
                  )}
                </View>
                <Pyramid
                  rows={overview.pyramid}
                  label={overview.pyramid.map((r) => `${r.gradeLabel}: ${r.countLabel}`).join(". ")}
                />
              </View>
            )}

            <Section title={t("climbs.working")} rows={overview.working} />
            <Section title={t("common.sentStatus")} rows={overview.sent} />
            {overview.working.length === 0 && overview.sent.length === 0 && (
              <Text
                style={{
                  padding: 18,
                  textAlign: "center",
                  fontFamily: fonts.sans,
                  fontSize: 14,
                  lineHeight: 21,
                  color: colors.textSecondary,
                }}
              >
                {t("climbs.empty")}
              </Text>
            )}
          </View>
        )}
      </ScrollView>

      <Fab label={t("climbs.logAClimb")} onPress={() => router.push("/climb/log")} />
    </View>
  );
}
