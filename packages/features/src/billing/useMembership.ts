import { useQueryClient } from "@tanstack/react-query";
import React from "react";
import type { Entitlements, SendtallyApi } from "@sendtally/api-client";
import { queries, useQuery, type QueryState } from "../query";
import { hasAccess, trialDaysLeft } from "./access";
import { membershipVM } from "./transforms";
import type { MembershipVM } from "./types";

export type MembershipFeature = {
  state: QueryState<Entitlements>;
  vm: MembershipVM;
  active: boolean | null;
  access: boolean | null;
  trialDaysLeft: number | null;
  reload: () => Promise<void>;
  refresh: () => Promise<Entitlements>;
};

export function useMembership(api: SendtallyApi): MembershipFeature {
  const client = useQueryClient();
  const { state, reload } = useQuery(queries.entitlements(api));

  const refresh = React.useCallback(async () => {
    const next = await api.refreshEntitlements();
    client.setQueryData(queries.entitlements(api).queryKey, next);
    return next;
  }, [api, client]);

  const entitlements = state.status === "ready" ? state.data : null;
  const vm = React.useMemo(() => membershipVM(entitlements), [entitlements]);
  const loading = state.status === "loading";
  const active = loading ? null : vm.active;
  const access = loading ? null : hasAccess(entitlements);

  return {
    state,
    vm,
    active,
    access,
    trialDaysLeft: trialDaysLeft(entitlements),
    reload,
    refresh,
  };
}
