import React from "react";
import type { SendtallyApi } from "@sendtally/api-client";
import { useBuiltInLibrary } from "../library/LibraryProvider";
import { queries, useQuery, type QueryState } from "../query";
import { libraryOf } from "../workouts/library";
import { useWorkouts } from "../workouts/useWorkouts";
import { hangModel, type HangModel } from "./model";

export type HangFeature = { state: QueryState<HangModel>; reload: () => Promise<void> };

/**
 * The hangboard data with every hangboard workout in the library: ready once it and the built-in
 * library are, so every training screen waits for the library here, with its own retry.
 */
export function useHang(api: SendtallyApi): HangFeature {
  const { state: loaded, reload: reloadHang } = useQuery(queries.hang(api));
  const { state: mine, reload: reloadMine } = useWorkouts(api);
  const { state: builtIns, reload: reloadBuiltIns } = useBuiltInLibrary(api);
  const state = React.useMemo((): QueryState<HangModel> => {
    if (builtIns.status !== "ready") return builtIns;
    if (loaded.status !== "ready") return loaded;
    if (mine.status !== "ready") return mine;
    return { status: "ready", data: hangModel(loaded.data, libraryOf(mine.data)) };
  }, [builtIns, loaded, mine]);
  const reload = React.useCallback(async () => {
    await Promise.all([reloadHang(), reloadMine(), reloadBuiltIns()]);
  }, [reloadHang, reloadMine, reloadBuiltIns]);
  return { state, reload };
}
