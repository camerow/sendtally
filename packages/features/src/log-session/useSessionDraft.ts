import React from "react";
import type { SendtallyApi } from "@sendtally/api-client";
import { useQuery, type QueryState } from "../lib/useQuery";
import { draftFromSession } from "./transforms";
import type { LogSessionDraft } from "./types";

export type EditableSession = { editable: boolean; draft: LogSessionDraft };

export function useSessionDraft(
  api: SendtallyApi,
  fingerprint: string
): QueryState<EditableSession> {
  const load = React.useCallback(async (): Promise<EditableSession> => {
    const { session } = await api.session(fingerprint);
    return { editable: session.source === "manual", draft: draftFromSession(session) };
  }, [api, fingerprint]);

  return useQuery(load).state;
}
