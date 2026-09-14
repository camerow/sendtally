import { Link, router, useLocalSearchParams } from "expo-router";
import React from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useProject } from "@sendtally/features/climbs";
import { t } from "@sendtally/features/i18n";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { Icon } from "../../components/Icon";
import { BetaCard } from "../../features/projects/BetaCard";
import { ProjectChart } from "../../features/projects/ProjectChart";
import { useApi } from "../../lib/api";

const label = {
  fontFamily: fonts.monoMedium,
  fontSize: 10,
  letterSpacing: 0.8,
  textTransform: "uppercase",
  color: colors.textSecondary,
} as const;

export default function ProjectDetailScreen(): React.ReactElement {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const api = useApi();
  const project = useProject(api, slug ?? "");
  const { state } = project;

  function confirmUnmark(name: string, keeps: string): void {
    Alert.alert(t("projects.stopTracking", { name }), t("projects.stopTrackingBody", { keeps }), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("projects.unmark"),
        style: "destructive",
        onPress: () => {
          void project.unmark().then(() => router.back());
        },
      },
    ]);
  }

  if (state.status !== "ready") {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={["top"]}>
        <View style={{ padding: 28, alignItems: "center", gap: 12 }}>
          {state.status === "loading" ? (
            <ActivityIndicator color={colors.gunmetal} />
          ) : (
            <Text style={{ fontFamily: fonts.mono, fontSize: 13, color: colors.textMuted }}>
              {t("projects.loadOneFailed")}
            </Text>
          )}
        </View>
      </SafeAreaView>
    );
  }

  const vm = state.data;
  const sent = vm.status === "sent";
  const keeps =
    vm.sessions.length === 0
      ? t("projects.keepsNothing")
      : t("projects.historyStays", {
          attempts: vm.stats[0]?.value ?? "",
          sessions: vm.stats[1]?.value ?? "",
        });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 48, gap: 18 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Text
            style={{
              fontFamily: fonts.monoSemiBold,
              fontSize: 15,
              color: colors.gunmetal,
              textTransform: vm.gradeLabel === null ? "uppercase" : "none",
              paddingHorizontal: 12,
              paddingVertical: 7,
              borderRadius: radius.control,
              backgroundColor: colors.surfaceSoft,
              overflow: "hidden",
            }}
          >
            {vm.gradeLabel ?? vm.disciplineLabel}
          </Text>
          <Text
            numberOfLines={2}
            style={{
              flex: 1,
              fontFamily: fonts.display,
              fontSize: 22,
              letterSpacing: -0.5,
              color: colors.gunmetal,
            }}
          >
            {vm.name}
          </Text>
          <Text
            style={{
              ...label,
              color: colors.gunmetal,
              paddingHorizontal: 9,
              paddingVertical: 4,
              borderRadius: radius.pill,
              backgroundColor: sent ? colors.gold : "rgba(64,63,76,0.06)",
              overflow: "hidden",
            }}
          >
            {sent ? t("common.sentStatus") : t("common.open")}
          </Text>
        </View>

        {sent && vm.storyLabel !== null && (
          <View
            style={{ gap: 8, padding: 18, borderRadius: radius.card, backgroundColor: colors.gold }}
          >
            <Text style={{ ...label, color: colors.textSecondary }}>
              {t("projects.sentOn", { date: vm.stats[3]?.value ?? "" })}
            </Text>
            <Text
              style={{
                fontFamily: fonts.display,
                fontSize: 22,
                letterSpacing: -0.5,
                color: colors.gunmetal,
              }}
            >
              {vm.storyLabel}
            </Text>
            <Text style={{ ...label, color: colors.textSecondary }}>
              {t("projects.firstTried", {
                date: vm.bars[0]?.axisLabel ?? "-",
                value: vm.stats[2]?.value ?? "",
              })}
            </Text>
          </View>
        )}

        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: colors.lineOnLight,
          }}
        >
          {vm.stats.map((stat, i) => (
            <View
              key={stat.label}
              style={{
                width: "50%",
                gap: 3,
                paddingVertical: 12,
                paddingRight: 14,
                paddingLeft: i % 2 === 0 ? 0 : 14,
                borderRightWidth: i % 2 === 0 ? 1 : 0,
                borderRightColor: colors.lineOnLightSoft,
              }}
            >
              <Text style={label}>{stat.label}</Text>
              <Text
                style={{
                  fontFamily: fonts.monoSemiBold,
                  fontSize: 17,
                  color: colors.gunmetal,
                  textTransform: "uppercase",
                }}
              >
                {stat.value}
              </Text>
            </View>
          ))}
        </View>

        <View
          style={{
            gap: 14,
            backgroundColor: colors.white,
            borderWidth: 1,
            borderColor: colors.lineOnLight,
            borderRadius: radius.card,
            padding: 16,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "baseline" }}>
            <Text
              style={{
                fontFamily: fonts.monoMedium,
                fontSize: 11,
                letterSpacing: 0.8,
                textTransform: "uppercase",
                color: colors.labelAccent,
              }}
            >
              {t("projects.attemptsPerSession")}
            </Text>
            <View style={{ flex: 1 }} />
            <Text style={{ ...label, color: colors.textMuted }}>{vm.rangeLabel}</Text>
          </View>
          {vm.bars.length === 0 ? (
            <Text
              style={{
                fontFamily: fonts.sans,
                fontSize: 14,
                lineHeight: 22,
                color: colors.textSecondary,
              }}
            >
              {t("projects.chartEmpty")}
            </Text>
          ) : (
            <ProjectChart bars={vm.bars} />
          )}
        </View>

        <BetaCard
          beta={vm.beta}
          updatedLabel={vm.betaUpdatedLabel}
          onSave={(beta) => project.saveBeta(beta)}
        />

        <View
          style={{
            flexDirection: "row",
            alignItems: "baseline",
            gap: 10,
            paddingBottom: 9,
            borderBottomWidth: 1,
            borderBottomColor: colors.lineOnLight,
          }}
        >
          <Text
            style={{
              fontFamily: fonts.display,
              fontSize: 15,
              letterSpacing: -0.3,
              color: colors.gunmetal,
            }}
          >
            {t("projects.sessionsInvested")}
          </Text>
          <Text style={{ ...label, color: colors.textMuted }}>{vm.sessionsMetaLabel}</Text>
        </View>

        {vm.sessions.map((session) => (
          <Link key={session.fingerprint} href={`/session/${session.fingerprint}`} asChild>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                padding: 16,
                borderRadius: radius.card,
                backgroundColor: colors.surfaceSoft,
              }}
            >
              <View style={{ width: 62, gap: 3 }}>
                <Text style={label}>{session.weekday}</Text>
                <Text
                  style={{
                    fontFamily: fonts.monoSemiBold,
                    fontSize: 16,
                    color: colors.gunmetal,
                    textTransform: "uppercase",
                  }}
                >
                  {session.dateLabel}
                </Text>
              </View>
              <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
                <Text
                  numberOfLines={1}
                  style={{ fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.gunmetal }}
                >
                  {session.title}
                </Text>
                <Text
                  numberOfLines={1}
                  style={{
                    fontFamily: fonts.mono,
                    fontSize: 11,
                    color: colors.textSecondary,
                    textTransform: "uppercase",
                  }}
                >
                  {session.metaLabel}
                  {session.sent ? t("projects.sessionSent") : ""}
                </Text>
                {session.notes !== null && (
                  <Text
                    numberOfLines={2}
                    style={{
                      fontFamily: fonts.sans,
                      fontSize: 13,
                      lineHeight: 19,
                      color: colors.textSecondary,
                    }}
                  >
                    {session.notes}
                  </Text>
                )}
              </View>
              <View style={{ alignItems: "flex-end", gap: 2 }}>
                <Text
                  style={{ fontFamily: fonts.monoSemiBold, fontSize: 15, color: colors.gunmetal }}
                >
                  {session.attempts}
                </Text>
                <Text style={{ ...label, fontSize: 9, color: colors.textMuted }}>
                  {t("projects.attemptsUnit", { count: session.attempts })}
                </Text>
              </View>
              <Icon name="chevron" size={14} color={colors.textFaint} />
            </View>
          </Link>
        ))}
        {vm.sessions.length === 0 && (
          <Text style={{ ...label, color: colors.textMuted }}>{t("projects.notTriedYet")}</Text>
        )}

        <Pressable
          onPress={() => confirmUnmark(vm.name, keeps)}
          accessibilityRole="button"
          style={{
            height: 48,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: radius.control,
            borderWidth: 1,
            borderColor: "rgba(64,63,76,0.25)",
          }}
        >
          <Text
            style={{ fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.watermelonInk }}
          >
            {t("projects.unmarkProject")}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
