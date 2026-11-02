import { useQueryClient } from "@tanstack/react-query";
import React from "react";
import type { HangData, HangSessionRecord, SendtallyApi } from "@sendtally/api-client";
import type { Grip, HangSession, HangSettings } from "@sendtally/core/hang";
import { patch, useLocalWrite, type LocalOp } from "../outbox";
import { queries } from "../query";

export type HangActions = {
  saveGrip: (grip: Grip) => Promise<void>;
  /** Hides a grip from the pickers and Exercises; its history stays. */
  archiveGrip: (grip: Grip) => Promise<void>;
  setDefaultGrip: (workoutId: string, gripId: string) => Promise<void>;
  saveSession: (session: HangSession) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  saveSettings: (settings: Partial<HangSettings>) => Promise<void>;
};

const upsert = <T extends { id: string }>(list: readonly T[], item: T): T[] =>
  list.some((x) => x.id === item.id)
    ? list.map((x) => (x.id === item.id ? item : x))
    : [...list, item];

const pendingRecord = (session: HangSession, previous?: HangSessionRecord): HangSessionRecord => ({
  stravaActivityId: null,
  postState: null,
  postError: null,
  ...previous,
  ...session,
  updatedAt: new Date().toISOString(),
});

/**
 * Writes apply to the cache and the outbox at once; the outbox sends them in order, offline
 * included, and reports one the server refuses.
 */
export function useHangActions(api: SendtallyApi): HangActions {
  const client = useQueryClient();
  const local = useLocalWrite();
  const key = React.useMemo(() => queries.hang(api).queryKey, [api]);

  return React.useMemo((): HangActions => {
    const write = async (update: (data: HangData) => HangData, op: LocalOp): Promise<void> =>
      local(op, patch(key, update));
    const known = (id: string): boolean =>
      client.getQueryData<HangData>(key)?.sessions.some((s) => s.id === id) === true;

    return {
      saveGrip: (grip) =>
        write((d) => ({ ...d, grips: upsert(d.grips, grip) }), {
          key: `hang:grip:${grip.id}`,
          method: "saveHangGrip",
          args: [grip],
        }),
      archiveGrip: (grip) =>
        write(
          (d) => ({
            ...d,
            grips: upsert(d.grips, { ...grip, hidden: true }),
            defaultGrips: Object.fromEntries(
              Object.entries(d.defaultGrips).filter(([, gripId]) => gripId !== grip.id)
            ),
          }),
          { key: `hang:grip:${grip.id}`, kind: "delete", method: "deleteHangGrip", args: [grip.id] }
        ),
      setDefaultGrip: (workoutId, gripId) =>
        write((d) => ({ ...d, defaultGrips: { ...d.defaultGrips, [workoutId]: gripId } }), {
          key: `hang:default-grip:${workoutId}`,
          method: "setHangDefaultGrip",
          args: [workoutId, gripId],
        }),
      saveSession: (session) =>
        write(
          (d) => ({
            ...d,
            sessions: upsert(
              d.sessions,
              pendingRecord(
                session,
                d.sessions.find((s) => s.id === session.id)
              )
            ),
          }),
          {
            key: `hang:session:${session.id}`,
            kind: known(session.id) ? "update" : "create",
            method: "saveHangSession",
            args: [session],
          }
        ),
      deleteSession: (id) =>
        write((d) => ({ ...d, sessions: d.sessions.filter((s) => s.id !== id) }), {
          key: `hang:session:${id}`,
          kind: "delete",
          method: "deleteHangSession",
          args: [id],
        }),
      // Settings save in part, so only a later save of the same fields replaces an unsent one.
      saveSettings: (settings) =>
        write((d) => ({ ...d, settings: { ...d.settings, ...settings } }), {
          key: `hang:settings:${Object.keys(settings).sort().join(",")}`,
          method: "saveHangSettings",
          args: [settings],
        }),
    };
  }, [client, key, local]);
}
