import type { SendtallyApi, SessionDetail } from "@sendtally/api-client";
import { queries, useQuery, type QueryState } from "../query";
import { draftFromSession } from "./transforms";
import type { LogSessionDraft } from "./types";

export type EditableSession = { editable: boolean; draft: LogSessionDraft };

const editable = (session: SessionDetail): EditableSession => ({
  editable: session.source === "manual",
  draft: draftFromSession(session),
});

export function useSessionDraft(
  api: SendtallyApi,
  fingerprint: string
): QueryState<EditableSession> {
  return useQuery({ ...queries.session(api, fingerprint), select: editable }).state;
}
