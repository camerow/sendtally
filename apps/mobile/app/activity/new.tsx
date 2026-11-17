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
import { HangDataProvider } from "../../features/training/data/HangDataProvider";
import { readPlanLink, readSession } from "@sendtally/features/training";
import { useGrips } from "@sendtally/features/hang";
import { livePartForm, usePrescribed } from "@sendtally/features/workouts";
import { liveRun } from "../../features/live-session/liveRun";
import { useApi } from "../../lib/api";

// A plan or a library workout opens this with what it already knows: the kind, its title,
// the day, itself and the plan it ran. What it prescribes starts as done, so the form
// waits for it to load. A mix's grips are its fingerboard part: the rows its timer ended with
// when it ran, and nothing when it is logged without running.
export default function NewActivityScreen(): React.ReactElement {
  const params = useLocalSearchParams<ActivityPrefill & { live?: string }>();
  const [id] = React.useState(randomUUID);
  const api = useApi();
  const grips = useGrips(api);
  const [part] = React.useState(() => {
    const state = params.live === "1" ? liveRun.read()?.state : undefined;
    const fingers = state?.player === "sets" ? state.fingers : undefined;
    return fingers !== undefined && "done" in fingers ? livePartForm(fingers) : undefined;
  });
  const prescribed = usePrescribed(
    api,
    params.workoutId ?? null,
    readPlanLink(params),
    readSession(params)
  );
  const [initial, setInitial] = React.useState<ActivityDraft | null>(null);
  if (initial === null && prescribed !== undefined) {
    const draft = newActivityDraft(params, today(), prescribed);
    setInitial({ ...draft, done: draft.done.filter((d) => !grips.isGrip(d.exercise)) });
  }
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={["top", "bottom"]}>
      {initial === null ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colors.gunmetal} />
        </View>
      ) : (
        <HangDataProvider>
          <ActivityForm
            id={id}
            initial={initial}
            logged={null}
            timed={params.startTime !== undefined}
            kindSet={params.kind !== undefined}
            live={params.live === "1"}
            planned={prescribed}
            {...(part !== undefined && { part, gripName: grips.gripName })}
          />
        </HangDataProvider>
      )}
    </SafeAreaView>
  );
}
