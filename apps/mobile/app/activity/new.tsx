import { randomUUID } from "expo-crypto";
import { useLocalSearchParams } from "expo-router";
import React from "react";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@sendtally/design/tokens";
import {
  newActivityDraft,
  type ActivityDraft,
  type ActivityPrefill,
} from "@sendtally/features/activities";
import { today } from "@sendtally/features/journal";
import { ActivityForm } from "../../features/training/activity/ActivityForm";
import { readPlanLink, readSession } from "../../features/training/data/planLinkParams";
import { usePrescribed } from "../../features/training/data/usePrescribed";

// A plan or a library workout opens this with what it already knows: the kind, its title,
// the day, itself and the plan it ran. What it prescribes starts as done, so the form
// waits for it to load.
export default function NewActivityScreen(): React.ReactElement {
  const params = useLocalSearchParams<ActivityPrefill & { live?: string }>();
  const [id] = React.useState(randomUUID);
  const prescribed = usePrescribed(
    params.workoutId ?? null,
    readPlanLink(params),
    readSession(params)
  );
  const [initial, setInitial] = React.useState<ActivityDraft | null>(null);
  if (initial === null && prescribed !== undefined) {
    setInitial(newActivityDraft(params, today(), prescribed));
  }
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={["top", "bottom"]}>
      {initial === null ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colors.gunmetal} />
        </View>
      ) : (
        <ActivityForm
          id={id}
          initial={initial}
          logged={null}
          timed={params.startTime !== undefined}
          kindSet={params.kind !== undefined}
          live={params.live === "1"}
          planned={prescribed}
        />
      )}
    </SafeAreaView>
  );
}
