import { useLocalSearchParams } from "expo-router";
import React from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { Activity } from "@sendtally/api-client";
import { colors, fonts } from "@sendtally/design/tokens";
import { draftFromActivity, useActivities } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import { BackButton } from "../../components/BackButton";
import { ActivityForm } from "../../features/training/activity/ActivityForm";
import { useApi } from "../../lib/api";

export default function EditActivityScreen(): React.ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state } = useActivities(useApi());
  const found = state.status === "ready" ? state.data.find((a) => a.id === id) : undefined;
  // Held from the first read, so a delete can leave the screen without it flashing "not found".
  const [kept, setKept] = React.useState<Activity | null>(null);
  if (kept === null && found !== undefined) setKept(found);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={["top", "bottom"]}>
      {kept !== null ? (
        <ActivityForm id={kept.id} initial={draftFromActivity(kept)} editing />
      ) : state.status === "loading" ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colors.gunmetal} />
        </View>
      ) : (
        <View style={{ padding: 18, gap: 16 }}>
          <BackButton />
          <Text style={{ fontFamily: fonts.sans, fontSize: 15, color: colors.textSecondary }}>
            {state.status === "error"
              ? t("common.somethingWentWrongTryAgain")
              : t("activities.notFound")}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}
