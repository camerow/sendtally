import { useQueryClient } from "@tanstack/react-query";
import React from "react";
import type { HangData, HangSessionRecord, SendtallyApi } from "@sendtally/api-client";
import type {
  Grip,
  HangSession,
  HangSettings,
  Loads,
  Schedule,
  Workout,
} from "@sendtally/core/hang";
import { queries } from "../query";

export type HangActions = {
  saveGrip: (grip: Grip) => Promise<void>;
  saveWorkout: (workout: Workout) => Promise<void>;
  setDefaultGrip: (workoutId: string, gripId: string) => Promise<void>;
  setLoads: (loads: Loads) => Promise<void>;
  saveSchedules: (schedules: Schedule[]) => Promise<void>;
  deleteSchedule: (id: string) => Promise<void>;
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

// ponytail: one chain for every hangtally write, so two quick taps on a load
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
          () => api.saveHangGrip(grip.id, grip.name)
        ),
      saveWorkout: (workout) =>
        write(
          (d) => ({ ...d, workouts: upsert(d.workouts, workout) }),
          () => {
            const { id, source: _source, ...fields } = workout;
            return api.saveHangWorkout(id, fields);
          }
        ),
      setDefaultGrip: (workoutId, gripId) =>
        write(
          (d) => ({ ...d, defaultGrips: { ...d.defaultGrips, [workoutId]: gripId } }),
          () => api.setHangDefaultGrip(workoutId, gripId)
        ),
      setLoads: (loads) =>
        write(
          (d) => ({ ...d, loads: { ...d.loads, ...loads } }),
          () => api.setHangLoads(loads)
        ),
      saveSchedules: (schedules) =>
        write(
          (d) => ({ ...d, schedules: schedules.reduce(upsert, d.schedules) }),
          () => Promise.all(schedules.map((s) => api.saveHangSchedule(s)))
        ),
      deleteSchedule: (id) =>
        write(
          (d) => ({ ...d, schedules: d.schedules.filter((s) => s.id !== id) }),
          () => api.deleteHangSchedule(id)
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
