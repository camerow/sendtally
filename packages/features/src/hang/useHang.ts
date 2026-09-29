import React from "react";
import type { SendtallyApi } from "@sendtally/api-client";
import { queries, useQuery, type QueryState } from "../query";
import { hangModel, type HangModel } from "./model";

export type HangFeature = { state: QueryState<HangModel>; reload: () => Promise<void> };

export function useHang(api: SendtallyApi): HangFeature {
  const { state: loaded, reload } = useQuery(queries.hang(api));
  const state = React.useMemo(
    (): QueryState<HangModel> =>
      loaded.status === "ready" ? { status: "ready", data: hangModel(loaded.data) } : loaded,
    [loaded]
  );
  return { state, reload };
}
