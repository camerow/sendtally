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
import { usePlan } from "@sendtally/features/training";
import { useApi } from "../../lib/api";
import { blockOn } from "../../features/training/calendar/calendarGrid";
import { ActivityForm } from "../../features/training/activity/ActivityForm";
import { readPlanLink, readSession } from "../../features/training/data/planLinkParams";
import { usePrescribed } from "../../features/training/data/usePrescribed";

// A plan or a library workout opens this with what it already knows: the kind, its title,
// the day, itself and the plan it ran. What it prescribes starts as done, and a log with no
// workout takes the focus of the block running that day, so the form waits for both.
export default function NewActivityScreen(): React.ReactElement {
  const params = useLocalSearchParams<ActivityPrefill>();
  const [id] = React.useState(randomUUID);
  const prescribed = usePrescribed(
    params.workoutId ?? null,
    readPlanLink(params),
    readSession(params)
  );
  const plan = usePlan(useApi()).state;
  const [initial, setInitial] = React.useState<ActivityDraft | null>(null);
  if (initial === null && prescribed !== undefined && plan.status !== "loading") {
    const date = params.date ?? today();
    const block = plan.status === "ready" ? blockOn(plan.data.blocks, date) : null;
    setInitial(newActivityDraft(params, today(), prescribed, block?.focus ?? null));
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
        />
      )}
    </SafeAreaView>
  );
}
