import React from "react";
import type { Gym, GymInput, SendtallyApi } from "@sendtally/api-client";
import { useQuery, type QueryState } from "../lib/useQuery";

export type GymsFeature = {
  state: QueryState<{ gyms: Gym[] }>;
  gyms: Gym[];
  ready: boolean;
  reload: () => void;
  save: (id: string | null, input: GymInput) => Promise<Gym | null>;
  remove: (id: string) => Promise<void>;
};

export function useGyms(api: SendtallyApi): GymsFeature {
  const load = React.useCallback(() => api.gyms(), [api]);
  const cacheKey = React.useMemo(() => ({ owner: api, key: "gyms" }), [api]);
  const { state, reload } = useQuery(load, cacheKey);
  const gyms = state.status === "ready" ? state.data.gyms : [];

  const save = React.useCallback(
    async (id: string | null, input: GymInput): Promise<Gym | null> => {
      const { gym } = id === null ? await api.createGym(input) : await api.updateGym(id, input);
      reload();
      return gym;
    },
    [api, reload]
  );

  const remove = React.useCallback(
    async (id: string): Promise<void> => {
      await api.deleteGym(id);
      reload();
    },
    [api, reload]
  );

  return { state, gyms, ready: state.status === "ready", reload, save, remove };
}
