import { queries, useQuery, type QueryState } from "../query";
import type { SendtallyApi } from "@sendtally/api-client";
import type { AreaClimbPage, AreaPage, AreaRedirect } from "./types";

/** The server-rendered page seeds the cache, and a write to Areas refetches it. */
export function useArea(
  api: SendtallyApi,
  slug: string,
  initial: AreaPage
): QueryState<AreaPage | AreaRedirect> {
  return useQuery({
    ...queries.area(api, slug),
    initialData: initial,
    initialDataUpdatedAt: Date.now,
  }).state;
}

export function useAreaClimb(
  api: SendtallyApi,
  slug: string,
  initial: AreaClimbPage
): QueryState<AreaClimbPage | AreaRedirect> {
  return useQuery({
    ...queries.areaClimb(api, slug),
    initialData: initial,
    initialDataUpdatedAt: Date.now,
  }).state;
}
