import React from "react";
import type { ClimbSummary, SendtallyApi, SessionWithClimbs } from "@sendtally/api-client";
import { t } from "../i18n";
import { queries, useQueryPair, type QueryState } from "../query";
import { climbDetailVM, type ClimbDetailVM } from "./overview";

export type ClimbsData = { climbs: ClimbSummary[]; sessions: SessionWithClimbs[] };

export type ClimbsFeature = { state: QueryState<ClimbsData>; reload: () => Promise<void> };

export function useClimbs(api: SendtallyApi): ClimbsFeature {
  const { state: loaded, reload } = useQueryPair(
    queries.climbs(api),
    queries.sessionsWithClimbs(api)
  );
  const state = React.useMemo((): QueryState<ClimbsData> => {
    if (loaded.status !== "ready") return loaded;
    const [climbs, { sessions }] = loaded.data;
    return { status: "ready", data: { climbs, sessions } };
  }, [loaded]);
  return { state, reload };
}

export type ClimbFeature = {
  state: QueryState<{ climb: ClimbSummary; vm: ClimbDetailVM }>;
  setWorking: (working: boolean) => Promise<void>;
  /** Resolves to the climb's id after the rename: another one's when it merged into it. */
  rename: (name: string) => Promise<string>;
};

/** A climb by its id, or by the slug a web link carries. */
export function useClimb(api: SendtallyApi, idOrSlug: string): ClimbFeature {
  const { state: loaded } = useClimbs(api);
  const state = React.useMemo((): ClimbFeature["state"] => {
    if (loaded.status !== "ready") return loaded;
    const { climbs, sessions } = loaded.data;
    const climb = climbs.find((c) => c.id === idOrSlug || c.slug === idOrSlug);
    if (climb === undefined) return { status: "error", message: t("climbs.notFound") };
    return { status: "ready", data: { climb, vm: climbDetailVM(climb, sessions) } };
  }, [loaded, idOrSlug]);
  const id = state.status === "ready" ? state.data.climb.id : null;

  const setWorking = React.useCallback(
    async (working: boolean): Promise<void> => {
      if (id !== null) await api.updateClimb(id, { working });
    },
    [api, id]
  );
  const rename = React.useCallback(
    async (name: string): Promise<string> => {
      if (id === null) throw new Error("climb not loaded");
      return (await api.updateClimb(id, { name })).id;
    },
    [api, id]
  );
  return { state, setWorking, rename };
}
