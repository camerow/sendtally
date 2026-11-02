import { useQueryClient } from "@tanstack/react-query";
import React from "react";
import type {
  LogSessionInput,
  SendtallyApi,
  SessionDetail,
  SessionLog,
  SessionLogWithClimbs,
  TagSummary,
} from "@sendtally/api-client";
import { patch, put, useLocalWrite, type CachePatch } from "../outbox";
import { queries } from "../query";
import {
  localSession,
  sessionRowOf,
  sessionWithClimbsOf,
  withoutSession,
  withSession,
} from "./localSession";

export type LocalSessions = {
  /** Logs a session, or edits the one `fingerprint` names, and returns its fingerprint at once. */
  save: (input: LogSessionInput, fingerprint?: string) => string;
  remove: (fingerprint: string) => void;
};

/**
 * Climbing sessions written on the phone first: the log, the lists and the detail change at
 * once, scored locally, and the outbox takes the log to the server when it can.
 */
export function useLocalSessions(api: SendtallyApi, newId: () => string): LocalSessions {
  const client = useQueryClient();
  const local = useLocalWrite();

  return React.useMemo((): LocalSessions => {
    const log = queries.sessions(api).queryKey;
    const logWithClimbs = queries.sessionsWithClimbs(api).queryKey;
    const lists = (
      sessions: <T extends { fingerprint: string; start_at: string }>(
        list: readonly T[],
        row: (detail: SessionDetail) => T
      ) => T[]
    ): CachePatch[] => [
      patch<SessionLog>(log, (l) => ({ ...l, sessions: sessions(l.sessions, sessionRowOf) })),
      patch<SessionLogWithClimbs>(logWithClimbs, (l) => ({
        ...l,
        sessions: sessions(l.sessions, sessionWithClimbsOf),
      })),
    ];

    return {
      save: (input, editing) => {
        const fingerprint = editing ?? `manual-${newId()}`;
        const detail = queries.session(api, fingerprint).queryKey;
        const session = localSession(
          fingerprint,
          input,
          client.getQueryData<SessionLogWithClimbs>(logWithClimbs)?.sessions ?? [],
          client.getQueryData<TagSummary[]>(queries.tags(api).queryKey) ?? [],
          editing === undefined ? undefined : client.getQueryData<SessionDetail>(detail)
        );
        const key = `session:${fingerprint}`;
        local(
          editing === undefined
            ? { key, kind: "create", method: "logSession", args: [input, fingerprint] }
            : { key, method: "updateLoggedSession", args: [fingerprint, input] },
          put(detail, session),
          ...lists((list, row) => withSession(list, row(session)))
        );
        return fingerprint;
      },
      remove: (fingerprint) =>
        local(
          {
            key: `session:${fingerprint}`,
            kind: "delete",
            method: "deleteLoggedSession",
            args: [fingerprint],
          },
          ...lists((list) => withoutSession(list, fingerprint))
        ),
    };
  }, [api, client, local, newId]);
}
