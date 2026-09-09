import React from "react";
import type { Entitlements, SendtallyApi } from "@sendtally/api-client";
import { useQuery, type QueryState } from "../lib/useQuery";
import { membershipVM } from "./transforms";
import type { MembershipVM } from "./types";

export type MembershipFeature = {
  state: QueryState<Entitlements>;
  vm: MembershipVM;
  active: boolean | null;
  reload: () => void;
  refresh: () => Promise<Entitlements>;
};

export function useMembership(api: SendtallyApi): MembershipFeature {
  const load = React.useCallback(() => api.entitlements(), [api]);
  const { state: loaded, reload: reloadQuery } = useQuery(load);
  const [refreshed, setRefreshed] = React.useState<Entitlements | null>(null);

  const reload = React.useCallback(() => {
    setRefreshed(null);
    reloadQuery();
  }, [reloadQuery]);

  const refresh = React.useCallback(async () => {
    const next = await api.refreshEntitlements();
    setRefreshed(next);
    return next;
  }, [api]);

  const state: QueryState<Entitlements> =
    refreshed !== null ? { status: "ready", data: refreshed } : loaded;
  const entitlements = state.status === "ready" ? state.data : null;
  const vm = React.useMemo(() => membershipVM(entitlements), [entitlements]);
  const active = state.status === "loading" ? null : vm.active;

  return { state, vm, active, reload, refresh };
}
