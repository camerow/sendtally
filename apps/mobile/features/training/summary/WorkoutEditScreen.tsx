import React from "react";
import { ActivityIndicator, View } from "react-native";
import type { ActivityRecord, HangSessionRecord } from "@sendtally/api-client";
import { colors } from "@sendtally/design/tokens";
import { draftFromActivity, useActivities } from "@sendtally/features/activities";
import { useApi } from "../../../lib/api";
import { ActivityForm } from "../activity/ActivityForm";
import { useHangData } from "../data/HangDataContext";
import { HangSessionForm } from "./HangSessionForm";

type Found =
  { kind: "activity"; record: ActivityRecord } | { kind: "hang"; record: HangSessionRecord };

/** The form for a finished workout of either kind, read once so a delete can close it cleanly. */
export function WorkoutEditScreen({ id }: { id: string }): React.ReactElement {
  const { model } = useHangData();
  const { state } = useActivities(useApi());
  const activity = state.status === "ready" ? state.data.find((a) => a.id === id) : undefined;
  const hang = model.sessions.find((s) => s.id === id);
  const [kept, setKept] = React.useState<Found | null>(null);
  if (kept === null && activity !== undefined) setKept({ kind: "activity", record: activity });
  else if (kept === null && hang !== undefined) setKept({ kind: "hang", record: hang });

  if (kept?.kind === "hang") return <HangSessionForm session={kept.record} />;
  if (kept?.kind === "activity") {
    return (
      <ActivityForm
        id={kept.record.id}
        initial={draftFromActivity(kept.record)}
        logged={activity ?? kept.record}
      />
    );
  }
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator color={colors.gunmetal} />
    </View>
  );
}
