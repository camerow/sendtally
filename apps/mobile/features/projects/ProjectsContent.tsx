import { Link } from "expo-router";
import React from "react";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useClimbVocabulary, useProjects } from "@sendtally/features/climbs";
import { useGradeScalePrefs } from "@sendtally/features/settings";
import { t } from "@sendtally/features/i18n";
import { colors, fonts } from "@sendtally/design/tokens";
import { Icon } from "../../components/Icon";
import { useApi } from "../../lib/api";
import { AddProjectSheet } from "./AddProjectSheet";
import { ProjectSection } from "./ProjectSection";
import { ProjectStats } from "./ProjectStats";

export type ProjectsContentProps = {
  header?: (caption: string) => React.ReactNode;
};

export function ProjectsContent({ header }: ProjectsContentProps): React.ReactElement {
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
  const caption =
    ready === null
      ? t("common.loading")
      : t("projects.openSentCount", { open: ready.overview.open, sent: ready.overview.sent });

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 96 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void projects.reload().finally(() => setRefreshing(false));
            }}
            tintColor={colors.gunmetal}
          />
        }
      >
        {header?.(caption)}

        {state.status === "error" && (
          <Text
            style={{
              paddingHorizontal: 18,
              fontFamily: fonts.mono,
              fontSize: 12,
              color: colors.watermelonInk,
            }}
          >
            {t("projects.loadFailedMobile")}
          </Text>
        )}

        {ready !== null && (
          <>
            {(ready.open.length > 0 || ready.sent.length > 0) && (
              <ProjectStats overview={ready.overview} />
            )}
            <ProjectSection
              title={t("common.open")}
              meta={t("projects.openMeta", {
                open: ready.open.length,
                count: ready.overview.attemptsInvested,
              })}
              items={ready.open}
            />
            <ProjectSection
              title={t("common.sentStatus")}
              meta={
                ready.overview.hardestSentLabel === null
                  ? String(ready.sent.length)
                  : t("projects.sentMeta", {
                      sent: ready.sent.length,
                      grade: ready.overview.hardestSentLabel,
                    })
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
                {t("projects.emptyBefore")}{" "}
                <Link href="/session/new" style={{ color: colors.azureInk }}>
                  {t("projects.emptyLink")}
                </Link>{" "}
                {t("projects.emptyAfter")}
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
          {t("projects.newProject")}
        </Text>
      </Pressable>

      <AddProjectSheet
        key={adding}
        visible={adding > 0}
        climbs={vocabulary.climbs}
        scales={scales}
        onClose={() => setAdding(0)}
        onSave={projects.save}
      />
    </View>
  );
}
