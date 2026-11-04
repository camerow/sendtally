import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import { Linking, ScrollView, View } from "react-native";
import { CLIMB_SORTS, climbSortLabel, useSessionDetail } from "@sendtally/features/session-detail";
import { kindLabel } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import { colors } from "@sendtally/design/tokens";
import { Chip } from "../../components/Chip";
import { ClimbingHero } from "../../features/climbs/ClimbingHero";
import { ClimbLogRow } from "../../features/climbs/ClimbLogRow";
import { EnduranceLaps } from "../../features/sessions/EnduranceLaps";
import { Pyramid } from "../../components/Pyramid";
import { ScreenFrame } from "../../components/ScreenFrame";
import { PyramidLegend } from "../../components/PyramidLegend";
import { SessionJournal } from "../../features/journal/SessionJournal";
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
import { useSessions } from "../../lib/useSessions";

export default function SessionDetailScreen(): React.ReactElement {
  const { fingerprint } = useLocalSearchParams<{ fingerprint: string }>();
  const api = useApi();
  const sessions = useSessions();
  const feature = useSessionDetail(api, fingerprint ?? "");
  const { state, sort, setSort } = feature;
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
    onDelete: () => sessions.remove(fingerprint ?? ""),
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
      <ClimbingHero kind={kindLabel("climbing")} title={vm.name} place={vm.place} meta={vm.when} />
      <SummaryTiles
        stats={[
          { value: String(vm.filterCounts.all), label: t("summary.climbs") },
          effortTile(vm.rpe, null),
          { value: String(vm.filterCounts.sent), label: t("summary.sent") },
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
          {state.data.rows.map((row) => (
            <ClimbLogRow key={row.n} row={row}>
              {row.endurance === undefined ? undefined : (
                <EnduranceLaps endurance={row.endurance} />
              )}
            </ClimbLogRow>
          ))}
        </View>
      </View>
    </ScreenFrame>
  );
}
