import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import React from "react";
import type { SendtallyApi, TrainingReminderSettings } from "@sendtally/api-client";
import { queries, useQuery } from "../query";

export type TrainingRemindersFeature = {
  /** Null until the status has loaded. */
  settings: TrainingReminderSettings | null;
  save: (change: Partial<TrainingReminderSettings>) => Promise<void>;
};

/** Merges the change into the cached status straight away and puts it back if the server refuses; rejects on failure. */
export async function saveTrainingReminders(
  client: QueryClient,
  api: SendtallyApi,
  change: Partial<TrainingReminderSettings>
): Promise<void> {
  const { queryKey } = queries.status(api);
  await client.cancelQueries({ queryKey });
  const previous = client.getQueryData(queryKey);
  client.setQueryData(queryKey, (status) =>
    status === undefined
      ? status
      : { ...status, trainingReminders: { ...status.trainingReminders, ...change } }
  );
  try {
    await api.setTrainingReminders(change);
  } catch (error) {
    client.setQueryData(queryKey, previous);
    throw error;
  }
}

export function useTrainingReminders(api: SendtallyApi): TrainingRemindersFeature {
  const client = useQueryClient();
  const { state } = useQuery(queries.status(api));
  const save = React.useCallback(
    (change: Partial<TrainingReminderSettings>) => saveTrainingReminders(client, api, change),
    [client, api]
  );
  return { settings: state.status === "ready" ? state.data.trainingReminders : null, save };
}
