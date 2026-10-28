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
import { enduranceLapCountLabel, enduranceSummaryLabel } from "@sendtally/features/log-session";
import { t } from "@sendtally/features/i18n";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { Chip } from "../../components/Chip";
import { CircuitDot } from "../../components/CircuitDot";
import { Icon } from "../../components/Icon";
import { EnduranceLaps } from "../../features/sessions/EnduranceLaps";
import { Pyramid } from "../../components/Pyramid";
import { ScreenFrame } from "../../components/ScreenFrame";
import { PyramidLegend } from "../../components/PyramidLegend";
import { PostStatusBar } from "../../features/sessions/PostStatusBar";
import { SessionJournal } from "../../features/journal/SessionJournal";
import { SessionTags } from "../../features/sessions/SessionTags";
import { DetailActions } from "../../features/training/components/DetailActions";
import { deleteRow } from "../../features/training/components/deleteRow";
import { LoadState } from "../../features/training/data/LoadState";
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

  if (state.status !== "ready")
    return (
      <LoadState
        state={state}
        onRetry={() => void feature.reload()}
        title={t("sessionDetail.loadFailed")}
        framed
      />
    );
  const { vm } = state.data;
  const remove = deleteRow({
    title: t("sessions.deleteSession"),
    hint: vm.stravaUrl === null ? t("summary.deleteHint") : t("summary.deleteHintStrava"),
    confirm: { title: t("sessions.deleteTitle"), body: t("sessions.deleteBody") },
    onDelete: () =>
      void api
        .deleteLoggedSession(fingerprint ?? "")
        .catch(() =>
          Alert.alert(t("sessions.deleteFailed"), t("common.somethingWentWrongTryAgain"))
        ),
  });
  const strava = vm.stravaUrl;

  return (
    <ScreenFrame
      action={
        <DetailActions
          onEdit={
            vm.editable
              ? () => router.push(`/session/${encodeURIComponent(fingerprint ?? "")}/edit`)
              : undefined
          }
          menu={
            strava === null
              ? [remove]
              : [
                  {
                    icon: "strava",
                    title: t("summary.viewOnStrava"),
                    hint: t("summary.viewHint"),
                    onPress: () => void Linking.openURL(strava),
                  },
                  remove,
                ]
          }
        />
      }
    >
      <View style={{ gap: 5 }}>
        <Text
          style={{
            fontFamily: fonts.sansSemiBold,
            fontSize: 20,
            letterSpacing: -0.2,
            color: colors.gunmetal,
          }}
        >
          {state.data.vm.title}
        </Text>
        <Text
          style={{
            fontFamily: fonts.monoMedium,
            fontSize: 10,
            letterSpacing: 0.6,
            textTransform: "uppercase",
            color: colors.textMuted,
          }}
        >
          {state.data.vm.area === null
            ? state.data.vm.meta
            : `${state.data.vm.meta} · ${state.data.vm.area.name}`}
        </Text>
      </View>

      {state.data.vm.pyramid.length > 0 && (
        <View
          style={{
            gap: 8,
            padding: 14,
            borderRadius: radius.cardLg,
            borderWidth: 1,
            borderColor: "rgba(64,63,76,0.12)",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontFamily: fonts.monoMedium,
                fontSize: 11,
                letterSpacing: 0.9,
                textTransform: "uppercase",
                color: colors.gunmetal,
              }}
            >
              {t("sessionDetail.byGrade")}
            </Text>
            <PyramidLegend inner={t("common.sent")} outer={t("sessionDetail.notYet")} />
          </View>
          <Pyramid
            rows={state.data.vm.pyramid}
            label={state.data.vm.pyramid.map((r) => `${r.gradeLabel}: ${r.countLabel}`).join(". ")}
          />
        </View>
      )}

      <SessionTags api={api} fingerprint={fingerprint ?? ""} initial={state.data.tags} />

      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 1,
          backgroundColor: colors.lineOnLight,
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        {state.data.vm.stats.map((st) => (
          <View
            key={st.label}
            style={{
              width: "33%",
              flexGrow: 1,
              gap: 4,
              backgroundColor: colors.surfaceSoft,
              paddingVertical: 11,
              paddingHorizontal: 13,
            }}
          >
            <Text
              style={{
                fontFamily: fonts.monoMedium,
                fontSize: 9,
                letterSpacing: 0.7,
                textTransform: "uppercase",
                color: colors.textMuted,
              }}
            >
              {st.label}
            </Text>
            <Text
              style={{
                fontFamily: fonts.monoSemiBold,
                fontSize: 16,
                color: colors.gunmetal,
              }}
            >
              {st.value}
            </Text>
          </View>
        ))}
      </View>

      <SessionJournal
        fingerprint={fingerprint ?? ""}
        date={state.data.vm.startDay}
        entries={state.data.entries}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}
      >
        {(
          [
            ["all", t("sessions.filterAll", { n: state.data.vm.filterCounts.all })],
            ["sent", t("sessions.filterSent", { n: state.data.vm.filterCounts.sent })],
            ["flash", t("sessions.filterFlashed", { n: state.data.vm.filterCounts.flash })],
            ["project", t("sessions.filterProjects", { n: state.data.vm.filterCounts.project })],
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
          <Chip key={s} label={climbSortLabel(s)} active={sort === s} onPress={() => setSort(s)} />
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
                      <Icon name="endurance" color={colors.petalInk} size={14} strokeWidth={2.4} />
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
      <PostStatusBar post={state.data.vm.post} action={feature.post} />
    </ScreenFrame>
  );
}
