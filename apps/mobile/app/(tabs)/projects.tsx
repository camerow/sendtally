import { Link } from "expo-router";
import React from "react";
import { FlatList, RefreshControl, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { ClimbSummary } from "@sendtally/api-client";
import { projectStatus, projectsOf, useClimbVocabulary } from "@sendtally/features/climbs";
import { colors, fonts } from "@sendtally/design/tokens";
import { LogoMark } from "../../components/Logo";
import { ProjectRow } from "../../features/projects/ProjectRow";
import { useApi } from "../../lib/api";

export default function Projects(): React.ReactElement {
  const api = useApi();
  const vocabulary = useClimbVocabulary(api);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const projects = React.useMemo(() => projectsOf(vocabulary.climbs), [vocabulary.climbs]);
  const open = projects.filter((p) => projectStatus(p) === "open").length;

  const unmark = async (climb: ClimbSummary): Promise<void> => {
    setError(null);
    try {
      await vocabulary.unmarkProject(climb);
    } catch {
      setError("Could not remove the project. Try again.");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={["top"]}>
      <FlatList
        data={projects}
        keyExtractor={(c) => c.slug}
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void vocabulary.reload().finally(() => setRefreshing(false));
            }}
            tintColor={colors.gunmetal}
          />
        }
        ListHeaderComponent={
          <View style={{ gap: 8 }}>
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
                Projects
              </Text>
              <View style={{ flex: 1 }} />
              <Text
                style={{
                  fontFamily: fonts.monoMedium,
                  fontSize: 10,
                  letterSpacing: 0.8,
                  color: colors.textMuted,
                }}
              >
                {vocabulary.loaded ? `${open} OPEN · ${projects.length - open} SENT` : "LOADING…"}
              </Text>
            </View>
            {error !== null && (
              <Text
                style={{
                  paddingHorizontal: 18,
                  fontFamily: fonts.mono,
                  fontSize: 12,
                  color: colors.watermelonInk,
                }}
              >
                {error}
              </Text>
            )}
          </View>
        }
        ListEmptyComponent={
          vocabulary.loaded ? (
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
              No projects yet. Flag a climb while{" "}
              <Link href="/session/new" style={{ color: colors.azureInk }}>
                logging a session
              </Link>{" "}
              and every attempt and session you put into it adds up here.
            </Text>
          ) : null
        }
        renderItem={({ item }) => <ProjectRow climb={item} onUnmark={() => void unmark(item)} />}
      />
    </SafeAreaView>
  );
}
