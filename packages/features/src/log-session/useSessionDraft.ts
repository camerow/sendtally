import React from "react";
import type { SendtallyApi } from "@sendtally/api-client";
import { queries, useQuery, type QueryState } from "../query";
import { draftFromSession } from "./transforms";
import type { LogSessionDraft } from "./types";

export type EditableSession = { editable: boolean; draft: LogSessionDraft };

export function useSessionDraft(
  api: SendtallyApi,
  fingerprint: string
): QueryState<EditableSession> {
  const { state } = useQuery(queries.session(api, fingerprint));
  return React.useMemo(
    () =>
      state.status === "ready"
        ? {
            status: "ready",
            data: { editable: state.data.source === "manual", draft: draftFromSession(state.data) },
          }
        : state,
    [state]
  );
}
