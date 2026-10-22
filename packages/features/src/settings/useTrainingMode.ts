import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import React from "react";
import type { SendtallyApi } from "@sendtally/api-client";
import { queries, useQuery } from "../query";

export type TrainingModeFeature = {
  enabled: boolean;
  ready: boolean;
  setEnabled: (next: boolean) => Promise<void>;
};

/** Flips the cached status straight away and puts it back if the server refuses; rejects on failure. */
export async function setTrainingMode(
  client: QueryClient,
  api: SendtallyApi,
  next: boolean
): Promise<void> {
  const { queryKey } = queries.status(api);
  await client.cancelQueries({ queryKey });
  const previous = client.getQueryData(queryKey);
  client.setQueryData(queryKey, (status) =>
    status === undefined ? status : { ...status, trainingMode: next }
  );
  try {
    await api.setTrainingMode(next);
  } catch (error) {
    client.setQueryData(queryKey, previous);
    throw error;
  }
}

export function useTrainingMode(api: SendtallyApi): TrainingModeFeature {
  const client = useQueryClient();
  const { state } = useQuery(queries.status(api));
  const setEnabled = React.useCallback(
    (next: boolean) => setTrainingMode(client, api, next),
    [client, api]
  );
  return {
    enabled: state.status === "ready" && state.data.trainingMode,
    ready: state.status !== "loading",
    setEnabled,
  };
}
