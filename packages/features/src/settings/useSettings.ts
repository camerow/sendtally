import React from "react";
import type { ConnectionStatus, SendtallyApi } from "@sendtally/api-client";
import { queries, useQuery, type QueryState } from "../query";
import { settingsVM } from "./transforms";
import type { SettingsVM } from "./types";

export type SettingsFeature = {
  state: QueryState<ConnectionStatus>;
  vm: SettingsVM;
  ready: boolean;
  reload: () => Promise<void>;
};

export function useSettings(api: SendtallyApi): SettingsFeature {
  const { state, reload } = useQuery(queries.status(api));
  const status = state.status === "ready" ? state.data : null;
  const vm = React.useMemo(() => settingsVM(status), [status]);
  return { state, vm, ready: state.status === "ready", reload };
}
