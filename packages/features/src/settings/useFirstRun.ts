import { useQueryClient } from "@tanstack/react-query";
import React from "react";
import type { FirstRunAnswers, SendtallyApi } from "@sendtally/api-client";
import { queries, useQuery } from "../query";

export type FirstRunFeature = {
  /** Null while the status loads; a failed load, or a server without the field, reads as not showing. */
  show: boolean | null;
  /** Marks it done here at once, so the flow never shows twice; a failed save shows it next launch. */
  finish: (answers: FirstRunAnswers) => Promise<void>;
};

export function useFirstRun(api: SendtallyApi): FirstRunFeature {
  const client = useQueryClient();
  const { state } = useQuery(queries.status(api));
  const finish = React.useCallback(
    async (answers: FirstRunAnswers) => {
      const { queryKey } = queries.status(api);
      client.setQueryData(queryKey, (status) => status && { ...status, firstRun: false });
      await api.finishFirstRun(answers);
    },
    [client, api]
  );
  const show =
    state.status === "loading" ? null : state.status === "ready" && state.data.firstRun === true;
  return { show, finish };
}
