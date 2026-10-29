import { useQueryClient } from "@tanstack/react-query";
import React from "react";
import type { HangData, HangSessionRecord, SendtallyApi } from "@sendtally/api-client";
import type { Grip, HangSession, HangSettings } from "@sendtally/core/hang";
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

// ponytail: one chain for every hangboard write, so two quick taps on a load
// reach the server in the order they were made. Per-key queues if it ever lags.
let chain: Promise<unknown> = Promise.resolve();

/**
 * Writes apply to the cache at once and go to the server in order behind it.
 * A failed write refetches, so the screen falls back to what the server holds,
 * and is reported through `onError`; the returned promises never reject.
 */
export function useHangActions(api: SendtallyApi, onError: (error: unknown) => void): HangActions {
  const client = useQueryClient();
  const key = React.useMemo(() => queries.hang(api).queryKey, [api]);

  return React.useMemo((): HangActions => {
    const write = async (
      patch: (data: HangData) => HangData,
      request: () => Promise<unknown>
    ): Promise<void> => {
      await client.cancelQueries({ queryKey: key });
      client.setQueryData<HangData>(key, (data) => (data === undefined ? data : patch(data)));
      const next = chain.then(request);
      chain = next.catch(() => undefined);
      try {
        await next;
      } catch (error) {
        onError(error);
        await client.invalidateQueries({ queryKey: key });
      }
    };

    return {
      saveGrip: (grip) =>
        write(
          (d) => ({ ...d, grips: upsert(d.grips, grip) }),
          () => api.saveHangGrip(grip)
        ),
      archiveGrip: (grip) =>
        write(
          (d) => ({
            ...d,
            grips: upsert(d.grips, { ...grip, hidden: true }),
            defaultGrips: Object.fromEntries(
              Object.entries(d.defaultGrips).filter(([, gripId]) => gripId !== grip.id)
            ),
          }),
          () => api.deleteHangGrip(grip.id)
        ),
      setDefaultGrip: (workoutId, gripId) =>
        write(
          (d) => ({ ...d, defaultGrips: { ...d.defaultGrips, [workoutId]: gripId } }),
          () => api.setHangDefaultGrip(workoutId, gripId)
        ),
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
          async () => {
            const saved = await api.saveHangSession(session);
            client.setQueryData<HangData>(key, (d) =>
              d === undefined ? d : { ...d, sessions: upsert(d.sessions, saved.session) }
            );
          }
        ),
      deleteSession: (id) =>
        write(
          (d) => ({ ...d, sessions: d.sessions.filter((s) => s.id !== id) }),
          () => api.deleteHangSession(id)
        ),
      saveSettings: (settings) =>
        write(
          (d) => ({ ...d, settings: { ...d.settings, ...settings } }),
          () => api.saveHangSettings(settings)
        ),
    };
  }, [api, client, key, onError]);
}
