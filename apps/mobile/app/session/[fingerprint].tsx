import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  CLIMB_SORTS,
  climbSortLabel,
  useSessionDetail,
  type ClimbFilter,
  type ClimbVM,
} from "@sendtally/features/session-detail";
import { t } from "@sendtally/features/i18n";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { Chip } from "../../components/Chip";
import { CircuitDot } from "../../components/CircuitDot";
import { PostStatusBar } from "../../features/sessions/PostStatusBar";
import { SessionJournal } from "../../features/journal/SessionJournal";
import { SessionTags } from "../../features/sessions/SessionTags";
import { useApi } from "../../lib/api";
import { press } from "../../lib/press";

const RESULT_BADGES: Record<ClimbVM["result"], { bg: string; border: string; color: string }> = {
  onsight: { bg: colors.petalInk, border: colors.petalInk, color: colors.white },
  flash: { bg: colors.gold, border: colors.gold, color: colors.gunmetal },
  sent: { bg: "transparent", border: "rgba(64,63,76,0.25)", color: colors.textSecondary },
  project: { bg: "transparent", border: "rgba(64,63,76,0.15)", color: colors.textFaint },
};

function HeaderAction({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}): React.ReactElement {
  return (
    <Pressable onPress={onPress} style={press({ minHeight: 44, justifyContent: "center" })}>
      <Text
        style={{
          fontFamily: fonts.monoMedium,
          fontSize: 12,
          letterSpacing: 0.5,
          textTransform: "uppercase",
          color: colors.labelAccent,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function SessionDetailScreen(): React.ReactElement {
  const { fingerprint } = useLocalSearchParams<{ fingerprint: string }>();
  const api = useApi();
  const feature = useSessionDetail(api, fingerprint ?? "");
  const { state, filter, setFilter, sort, setSort } = feature;
  const [deleting, setDeleting] = React.useState(false);

  function confirmDelete(): void {
    Alert.alert(t("sessions.deleteTitle"), t("sessions.deleteBody"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: () => {
          setDeleting(true);
          api
            .deleteLoggedSession(fingerprint ?? "")
            .then(() => router.replace("/(tabs)/sessions"))
            .catch(() => {
              setDeleting(false);
              Alert.alert(t("sessions.deleteFailed"), t("common.somethingWentWrongTryAgain"));
            });
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={["top"]}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 8, paddingBottom: 24, gap: 12 }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            minHeight: 44,
            alignItems: "center",
          }}
        >
          <Pressable
            onPress={() => router.back()}
            style={{ minHeight: 44, justifyContent: "center" }}
          >
            <Text
              style={{
                fontFamily: fonts.monoMedium,
                fontSize: 12,
                letterSpacing: 0.5,
                textTransform: "uppercase",
                color: colors.labelAccent,
              }}
            >
              {t("sessions.back")}
            </Text>
          </Pressable>
          {state.status === "ready" && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
              {state.data.vm.editable && (
                <HeaderAction
                  label={t("common.edit")}
                  onPress={() =>
                    router.push(`/session/${encodeURIComponent(fingerprint ?? "")}/edit`)
                  }
                />
              )}
              <HeaderAction
                label={deleting ? t("common.deleting") : t("common.delete")}
                onPress={() => {
                  if (!deleting) confirmDelete();
                }}
              />
              {state.data.vm.stravaUrl !== null && (
                <HeaderAction
                  label="Strava ↗"
                  onPress={() => void Linking.openURL(state.data.vm.stravaUrl ?? "")}
                />
              )}
            </View>
          )}
        </View>

        {state.status === "loading" && <ActivityIndicator color={colors.gunmetal} />}
        {state.status === "error" && (
          <Text style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.watermelonInk }}>
            {t("sessionDetail.loadFailed")}
          </Text>
        )}
        {state.status === "ready" && (
          <>
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
                {state.data.vm.meta}
              </Text>
            </View>

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
                      color: st.accent ? colors.labelAccent : colors.gunmetal,
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

            {state.data.vm.bars.length > 0 && (
              <View
                style={{
                  backgroundColor: colors.white,
                  borderWidth: 1,
                  borderColor: colors.lineOnLightSoft,
                  borderRadius: radius.card,
                  padding: 16,
                  gap: 10,
                }}
              >
                <Text
                  style={{
                    fontFamily: fonts.monoMedium,
                    fontSize: 10,
                    letterSpacing: 0.7,
                    textTransform: "uppercase",
                    color: colors.labelAccent,
                  }}
                >
                  {t("trends.sendsByGrade")}
                </Text>
                <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 5 }}>
                  {state.data.vm.bars.map((b) => (
                    <View key={b.gradeLabel} style={{ flex: 1, alignItems: "center", gap: 5 }}>
                      <View
                        style={{
                          width: "100%",
                          height: b.height === 0 ? 4 : Math.max(9, Math.round(b.height * 56)),
                          backgroundColor:
                            b.height === 0
                              ? colors.dataBarEmpty
                              : b.peak
                                ? colors.dataBarPeak
                                : colors.azure,
                          borderTopLeftRadius: 3,
                          borderTopRightRadius: 3,
                        }}
                      />
                      <Text
                        style={{
                          fontFamily: fonts.monoMedium,
                          fontSize: 10,
                          color: colors.textSecondary,
                        }}
                      >
                        {b.gradeLabel}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

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
                  [
                    "project",
                    t("sessions.filterProjects", { n: state.data.vm.filterCounts.project }),
                  ],
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
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12,
                      paddingVertical: 12,
                      borderTopWidth: 1,
                      borderTopColor: colors.lineOnLight,
                    }}
                  >
                    <View style={{ flex: 1, gap: 4, minWidth: 0 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        {c.colour !== undefined && <CircuitDot colour={c.colour} size={12} />}
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
                        {t("sessions.climbMeta", {
                          angle: c.angleLabel,
                          burns: t("sessions.burns", { count: c.burns }),
                          rest: c.restLabel,
                        })}
                      </Text>
                    </View>
                    <View style={{ alignItems: "flex-end", gap: 5 }}>
                      <Text
                        style={{
                          fontFamily: fonts.monoSemiBold,
                          fontSize: 14,
                          color: c.isTopSend ? colors.labelAccent : colors.gunmetal,
                        }}
                      >
                        {c.gradeLabel}
                      </Text>
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
                    </View>
                  </View>
                );
              })}
            </View>
            <PostStatusBar post={state.data.vm.post} action={feature.post} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
