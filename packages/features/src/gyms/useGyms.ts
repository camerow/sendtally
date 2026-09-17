import { useQueryClient } from "@tanstack/react-query";
import React from "react";
import type { Gym, GymInput, SendtallyApi } from "@sendtally/api-client";
import { queries, useQuery, type QueryState } from "../query";

export type GymsFeature = {
  state: QueryState<Gym[]>;
  gyms: Gym[];
  ready: boolean;
  reload: () => Promise<void>;
  save: (id: string | null, input: GymInput) => Promise<Gym | null>;
  remove: (id: string) => Promise<void>;
};

const NO_GYMS: Gym[] = [];

/** Saves land in the cached list straight away, so a gym picked right after creating it is there. */
export function useGyms(api: SendtallyApi): GymsFeature {
  const client = useQueryClient();
  const { state, reload } = useQuery(queries.gyms(api));
  const gyms = state.status === "ready" ? state.data : NO_GYMS;

  const save = React.useCallback(
    async (id: string | null, input: GymInput): Promise<Gym | null> => {
      const { gym } = id === null ? await api.createGym(input) : await api.updateGym(id, input);
      if (gym !== null) {
        client.setQueryData(queries.gyms(api).queryKey, (all = []) =>
          all.some((g) => g.id === gym.id)
            ? all.map((g) => (g.id === gym.id ? gym : g))
            : [...all, gym]
        );
      }
      return gym;
    },
    [api, client]
  );

  const remove = React.useCallback(
    async (id: string): Promise<void> => {
      await api.deleteGym(id);
      client.setQueryData(queries.gyms(api).queryKey, (all = []) => all.filter((g) => g.id !== id));
    },
    [api, client]
  );

  return { state, gyms, ready: state.status === "ready", reload, save, remove };
}
