import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import { Alert, Linking, ScrollView, Text, View } from "react-native";
import {
  CLIMB_SORTS,
  climbSortLabel,
  useSessionDetail,
  type ClimbFilter,
  type ClimbVM,
  climbMetaLabel,
} from "@sendtally/features/session-detail";
import { kindLabel } from "@sendtally/features/activities";
import { enduranceLapCountLabel, enduranceSummaryLabel } from "@sendtally/features/log-session";
import { t } from "@sendtally/features/i18n";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { Chip } from "../../components/Chip";
import { CircuitDot } from "../../components/CircuitDot";
import { ClimbingHero } from "../../features/climbs/ClimbingHero";
import { Icon } from "../../components/Icon";
import { EnduranceLaps } from "../../features/sessions/EnduranceLaps";
import { Pyramid } from "../../components/Pyramid";
import { ScreenFrame } from "../../components/ScreenFrame";
import { PyramidLegend } from "../../components/PyramidLegend";
import { SessionJournal } from "../../features/journal/SessionJournal";
import { SessionTags } from "../../features/sessions/SessionTags";
import { useStravaConnect } from "../../features/settings/useStravaConnect";
import { DetailActions } from "../../features/training/components/DetailActions";
import { deleteRow } from "../../features/training/components/deleteRow";
import { Label } from "../../features/training/components/Label";
import { LoadState } from "../../features/training/data/LoadState";
import { StravaStatusRow } from "../../features/training/summary/StravaStatusRow";
import { stravaRow } from "../../features/training/summary/stravaRow";
import { effortTile } from "../../features/training/summary/summaryText";
import { SummaryTiles } from "../../features/training/summary/SummaryTiles";
import { useApi } from "../../lib/api";

const RESULT_BADGES: Record<ClimbVM["result"], { bg: string; border: string; color: string }> = {
  onsight: { bg: colors.petalInk, border: colors.petalInk, color: colors.white },
  flash: { bg: colors.gold, border: colors.gold, color: colors.gunmetal },
  sent: { bg: "transparent", border: "rgba(64,63,76,0.25)", color: colors.textSecondary },
  project: { bg: "transparent", border: "rgba(64,63,76,0.15)", color: colors.textFaint },
};

export default function SessionDetailScreen(): React.ReactElement {
  const { fingerprint } = useLocalSearchParams<{ fingerprint: string }>();
  const api = useApi();
  const feature = useSessionDetail(api, fingerprint ?? "");
  const { state, filter, setFilter, sort, setSort } = feature;
  const { run, refresh } = feature.post;
  const connected = React.useCallback(() => {
    void refresh();
    run();
  }, [refresh, run]);
  const connect = useStravaConnect(api, connected);

  if (state.status !== "ready")
    return (
      <LoadState
        state={state}
        onRetry={() => void feature.reload()}
        title={t("sessionDetail.loadFailed")}
        framed
      />
    );
  const { vm, strava } = state.data;
  const remove = deleteRow({
    title: t("sessions.deleteSession"),
    hint: strava?.kind === "posted" ? t("summary.deleteHintStrava") : t("summary.deleteHint"),
    confirm: { title: t("sessions.deleteTitle"), body: t("sessions.deleteBody") },
    onDelete: () =>
      void api
        .deleteLoggedSession(fingerprint ?? "")
        .catch(() =>
          Alert.alert(t("sessions.deleteFailed"), t("common.somethingWentWrongTryAgain"))
        ),
  });
  const onStrava = (): void => {
    if (strava?.kind === "posted") void Linking.openURL(strava.url);
    else if (strava?.kind === "connect") connect.connect();
    else run();
  };

  return (
    <ScreenFrame
      action={
        <DetailActions
          onEdit={
            vm.editable
              ? () => router.push(`/session/${encodeURIComponent(fingerprint ?? "")}/edit`)
              : undefined
          }
          menu={strava === null ? [remove] : [stravaRow(strava, vm.rpe, onStrava), remove]}
        />
      }
    >
      <ClimbingHero kind={kindLabel("climbing")} state={vm.place} title={vm.name} meta={vm.when} />
      <SummaryTiles
        stats={[
          { value: vm.length ?? "–", label: t("summary.length") },
          effortTile(vm.rpe, null),
          { value: String(vm.filterCounts.sent), label: t("common.sent") },
        ]}
      />
      {strava !== null && <StravaStatusRow state={strava} />}

      {vm.pyramid.length > 0 && (
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
            style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
          >
            <Label color={colors.gunmetal}>{t("sessionDetail.byGrade")}</Label>
            <PyramidLegend inner={t("common.sent")} outer={t("sessionDetail.notYet")} />
          </View>
          <Pyramid
            rows={vm.pyramid}
            label={vm.pyramid.map((r) => `${r.gradeLabel}: ${r.countLabel}`).join(". ")}
          />
        </View>
      )}

      <SessionTags api={api} fingerprint={fingerprint ?? ""} initial={state.data.tags} />

      <SessionJournal
        fingerprint={fingerprint ?? ""}
        date={vm.startDay}
        entries={state.data.entries}
      />

      <View style={{ gap: 12 }}>
        <Label color={colors.gunmetal}>{`${t("common.climbs")} · ${vm.filterCounts.all}`}</Label>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
        >
          {(
            [
              ["all", t("sessions.filterAll", { n: vm.filterCounts.all })],
              ["sent", t("sessions.filterSent", { n: vm.filterCounts.sent })],
              ["flash", t("sessions.filterFlashed", { n: vm.filterCounts.flash })],
              ["project", t("sessions.filterProjects", { n: vm.filterCounts.project })],
            ] as Array<[ClimbFilter, string]>
          ).map(([value, label]) => (
            <Chip
              key={value}
              label={label}
              active={filter === value}
              onPress={() => setFilter(value)}
            />
          ))}
        </ScrollView>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
        >
          {CLIMB_SORTS.map((s) => (
            <Chip
              key={s}
              label={climbSortLabel(s)}
              active={sort === s}
              onPress={() => setSort(s)}
            />
          ))}
        </ScrollView>

        <View>
          {state.data.climbs.map((c) => {
            const badge = RESULT_BADGES[c.result];
            return (
              <View
                key={c.n}
                style={{
                  gap: 8,
                  paddingVertical: 12,
                  borderTopWidth: 1,
                  borderTopColor: colors.lineOnLight,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <View style={{ flex: 1, gap: 4, minWidth: 0 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      {c.colour !== undefined && <CircuitDot colour={c.colour} size={12} />}
                      {c.endurance !== undefined && (
                        <Icon
                          name="endurance"
                          color={colors.petalInk}
                          size={14}
                          strokeWidth={2.4}
                        />
                      )}
                      <Text
                        numberOfLines={1}
                        style={{
                          flexShrink: 1,
                          fontFamily: fonts.sansMedium,
                          fontSize: 15,
                          color: colors.gunmetal,
                        }}
                      >
                        {c.name}
                      </Text>
                    </View>
                    <Text
                      style={{
                        fontFamily: fonts.mono,
                        fontSize: 11,
                        color: "rgba(64,63,76,0.6)",
                      }}
                    >
                      {c.endurance === undefined
                        ? climbMetaLabel(c)
                        : `${enduranceLapCountLabel(c.endurance.laps.length)} · ${enduranceSummaryLabel(c.endurance)}`}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end", gap: 5 }}>
                    <Text
                      style={{
                        fontFamily: fonts.monoSemiBold,
                        fontSize: 14,
                        color: colors.gunmetal,
                      }}
                    >
                      {c.gradeLabel}
                    </Text>
                    {c.endurance === undefined && (
                      <Text
                        style={{
                          fontFamily: fonts.monoMedium,
                          fontSize: 9,
                          letterSpacing: 0.7,
                          textTransform: "uppercase",
                          borderRadius: radius.pill,
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          overflow: "hidden",
                          backgroundColor: badge.bg,
                          borderWidth: 1,
                          borderColor: badge.border,
                          color: badge.color,
                        }}
                      >
                        {c.resultLabel}
                      </Text>
                    )}
                  </View>
                </View>
                {c.endurance !== undefined && <EnduranceLaps endurance={c.endurance} />}
              </View>
            );
          })}
        </View>
      </View>
    </ScreenFrame>
  );
}
