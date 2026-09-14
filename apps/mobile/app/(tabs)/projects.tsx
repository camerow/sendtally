import { Link } from "expo-router";
import React from "react";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  useClimbVocabulary,
  useProjects,
  type ProjectListItem,
  type ProjectsOverviewVM,
} from "@sendtally/features/climbs";
import { useGradeScalePrefs } from "@sendtally/features/settings";
import { t, upper } from "@sendtally/features/i18n";
import { colors, fonts } from "@sendtally/design/tokens";
import { Icon } from "../../components/Icon";
import { LogoMark } from "../../components/Logo";
import { AddProjectSheet } from "../../features/projects/AddProjectSheet";
import { ProjectRow } from "../../features/projects/ProjectRow";
import { useApi } from "../../lib/api";

const label = {
  fontFamily: fonts.monoMedium,
  fontSize: 10,
  letterSpacing: 0.8,
  color: colors.textSecondary,
} as const;

function Stat({ name, value, last }: { name: string; value: string; last: boolean }) {
  return (
    <View
      style={{
        width: "50%",
        gap: 3,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRightWidth: last ? 0 : 1,
        borderRightColor: colors.lineOnLightSoft,
      }}
    >
      <Text numberOfLines={1} style={label}>
        {name}
      </Text>
      <Text style={{ fontFamily: fonts.monoSemiBold, fontSize: 17, color: colors.gunmetal }}>
        {value}
      </Text>
    </View>
  );
}

function Stats({ overview }: { overview: ProjectsOverviewVM }): React.ReactElement {
  return (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        marginHorizontal: 18,
        marginTop: 8,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: colors.lineOnLight,
      }}
    >
      <Stat
        name={upper(t("mobile.projects.attemptsInvested"))}
        value={String(overview.attemptsInvested)}
        last={false}
      />
      <Stat
        name={upper(t("mobile.projects.attemptsToSend"))}
        value={
          overview.avgAttemptsToSend === null
            ? "-"
            : upper(t("mobile.projects.avg", { avg: overview.avgAttemptsToSend }))
        }
        last
      />
      <Stat
        name={upper(t("mobile.projects.longestRunning"))}
        value={overview.longestRunning?.value ?? "-"}
        last={false}
      />
      <Stat
        name={upper(t("mobile.projects.mostSessions"))}
        value={overview.mostSessions?.value ?? "-"}
        last
      />
    </View>
  );
}

function Section({
  title,
  meta,
  items,
}: {
  title: string;
  meta: string;
  items: ProjectListItem[];
}): React.ReactElement | null {
  if (items.length === 0) return null;
  return (
    <View>
      <View
        style={{
          flexDirection: "row",
          alignItems: "baseline",
          gap: 10,
          marginHorizontal: 18,
          marginTop: 22,
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
          {title}
        </Text>
        <Text style={{ ...label, color: colors.textMuted }}>{meta}</Text>
      </View>
      {items.map((item) => (
        <ProjectRow key={item.climb.slug} item={item} />
      ))}
    </View>
  );
}

export default function Projects(): React.ReactElement {
  const api = useApi();
  const projects = useProjects(api);
  const { scales } = useGradeScalePrefs(api);
  const vocabulary = useClimbVocabulary(api);
  const [refreshing, setRefreshing] = React.useState(false);
  // A fresh key on each open is how the sheet starts blank: remounting beats
  // an effect that resets seven pieces of state.
  const [adding, setAdding] = React.useState(0);
  const { state } = projects;
  const ready = state.status === "ready" ? state.data : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 96 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              projects.reload();
              void vocabulary.reload().finally(() => setRefreshing(false));
            }}
            tintColor={colors.gunmetal}
          />
        }
      >
        <View
          style={{
            height: 44,
            flexDirection: "row",
            alignItems: "center",
            gap: 9,
            paddingHorizontal: 18,
          }}
        >
          <LogoMark size={22} />
          <Text
            style={{
              fontFamily: fonts.display,
              fontSize: 22,
              letterSpacing: -0.5,
              color: colors.gunmetal,
            }}
          >
            {t("mobile.projects.title")}
          </Text>
          <View style={{ flex: 1 }} />
          <Text style={{ ...label, color: colors.textMuted }}>
            {ready === null
              ? upper(t("mobile.common.loading"))
              : upper(
                  t("mobile.projects.openSentCount", {
                    open: ready.overview.open,
                    sent: ready.overview.sent,
                  })
                )}
          </Text>
        </View>

        {state.status === "error" && (
          <Text
            style={{
              paddingHorizontal: 18,
              fontFamily: fonts.mono,
              fontSize: 12,
              color: colors.watermelonInk,
            }}
          >
            {t("mobile.projects.loadFailed")}
          </Text>
        )}

        {ready !== null && (
          <>
            {(ready.open.length > 0 || ready.sent.length > 0) && (
              <Stats overview={ready.overview} />
            )}
            <Section
              title={t("mobile.projects.open")}
              meta={upper(
                t("mobile.projects.openMeta", {
                  open: ready.open.length,
                  count: ready.overview.attemptsInvested,
                })
              )}
              items={ready.open}
            />
            <Section
              title={t("mobile.projects.sent")}
              meta={
                ready.overview.hardestSentLabel === null
                  ? String(ready.sent.length)
                  : upper(
                      t("mobile.projects.sentMeta", {
                        sent: ready.sent.length,
                        grade: ready.overview.hardestSentLabel,
                      })
                    )
              }
              items={ready.sent}
            />
            {ready.open.length === 0 && ready.sent.length === 0 && (
              <Text
                style={{
                  padding: 28,
                  textAlign: "center",
                  fontFamily: fonts.mono,
                  fontSize: 13,
                  lineHeight: 20,
                  color: colors.textMuted,
                }}
              >
                {t("mobile.projects.emptyBefore")}
                <Link href="/session/new" style={{ color: colors.azureInk }}>
                  {t("mobile.projects.emptyLink")}
                </Link>
                {t("mobile.projects.emptyAfter")}
              </Text>
            )}
          </>
        )}
      </ScrollView>

      <Pressable
        onPress={() => setAdding((n) => n + 1)}
        accessibilityRole="button"
        style={{
          position: "absolute",
          right: 18,
          bottom: 16,
          flexDirection: "row",
          alignItems: "center",
          gap: 9,
          height: 52,
          paddingHorizontal: 22,
          borderRadius: 26,
          backgroundColor: colors.azureInk,
          shadowColor: "#14131A",
          shadowOpacity: 0.28,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 8 },
          elevation: 6,
        }}
      >
        <Icon name="plus" size={17} strokeWidth={3} color={colors.white} />
        <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.white }}>
          {t("mobile.projects.newProject")}
        </Text>
      </Pressable>

      <AddProjectSheet
        key={adding}
        visible={adding > 0}
        climbs={vocabulary.climbs}
        scales={scales}
        onClose={() => setAdding(0)}
        onSave={async (input) => {
          await projects.save(input);
          await vocabulary.reload();
        }}
      />
    </SafeAreaView>
  );
}
