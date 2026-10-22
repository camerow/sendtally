import { randomUUID } from "expo-crypto";
import { useLocalSearchParams } from "expo-router";
import React from "react";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@sendtally/design/tokens";
import {
  newActivityDraft,
  usePlanTemplate,
  type ActivityDraft,
  type ActivityPrefill,
} from "@sendtally/features/activities";
import { today } from "@sendtally/features/journal";
import { useWorkoutTemplate } from "@sendtally/features/workouts";
import { ActivityForm } from "../../features/training/activity/ActivityForm";
import { useApi } from "../../lib/api";

// A plan or a library workout opens this with what it already knows: the kind, its title,
// the day and itself. Its body fills the sets or checklist in, so the form waits for it to load.
export default function NewActivityScreen(): React.ReactElement {
  const params = useLocalSearchParams<ActivityPrefill>();
  const [id] = React.useState(randomUUID);
  const api = useApi();
  const planned = usePlanTemplate(api, params.planItemId ?? null);
  const ran = useWorkoutTemplate(api, params.workoutId ?? null);
  const [initial, setInitial] = React.useState<ActivityDraft | null>(null);
  if (initial === null && planned !== undefined && ran !== undefined) {
    setInitial(newActivityDraft(params, today(), planned ?? ran));
  }
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={["top", "bottom"]}>
      {initial === null ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colors.gunmetal} />
        </View>
      ) : (
        <ActivityForm id={id} initial={initial} logged={null} />
      )}
    </SafeAreaView>
  );
}
