import React from "react";
import { Alert } from "react-native";
import type { ActivityRecord, HangSessionRecord } from "@sendtally/api-client";
import { useActivities, useActivityActions } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import { useExerciseSeries } from "@sendtally/features/statistics";
import { useTrainingLog } from "@sendtally/features/training";
import { useApi } from "../../../lib/api";
import { useHangData } from "../data/HangDataContext";
import { LoadState } from "../data/LoadState";
import { ActivitySummary } from "./ActivitySummary";
import { HangSummary } from "./HangSummary";

const reportFailure = (): void => Alert.alert(t("activities.saveFailed"));

type Found =
  { kind: "activity"; record: ActivityRecord } | { kind: "hang"; record: HangSessionRecord };

/** One finished workout of any kind, found by its id among the activities and the hang sessions. */
export function WorkoutSummaryScreen({ id }: { id: string }): React.ReactElement {
  const api = useApi();
  const { model, actions: hangActions } = useHangData();
  const { state, reload } = useActivities(api);
  const series = useExerciseSeries(api);
  const { log } = useTrainingLog(api);
  const actions = useActivityActions(api, reportFailure);
  const activities = state.status === "ready" ? state.data : [];
  const activity = activities.find((a) => a.id === id);
  const hang = model.sessions.find((s) => s.id === id);
  const found: Found | undefined =
    activity !== undefined
      ? { kind: "activity", record: activity }
      : hang !== undefined
        ? { kind: "hang", record: hang }
        : undefined;
  // Held from the first read, so a delete can leave the screen without it flashing "not found".
  const [kept, setKept] = React.useState<Found | null>(null);
  if (kept === null && found !== undefined) setKept(found);
  const shown = found ?? kept;

  if (shown?.kind === "hang") {
    return <HangSummary session={shown.record} model={model} log={log} actions={hangActions} />;
  }
  if (shown?.kind === "activity") {
    return (
      <ActivitySummary
        activity={shown.record}
        activities={activities}
        series={series.status === "ready" ? series.data : []}
        log={log}
        unit={model.settings.units}
        actions={actions}
      />
    );
  }
  return (
    <LoadState
      state={
        state.status === "ready" ? { status: "error", message: t("activities.notFound") } : state
      }
      onRetry={() => void reload()}
      framed
    />
  );
}
