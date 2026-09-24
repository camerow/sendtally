import { keepPreviousData } from "@tanstack/react-query";
import React from "react";
import type { SendtallyApi } from "@sendtally/api-client";
import { queries, useQuery } from "../query";
import { canAddToAreas, cragsOf } from "./logForm";
import type { AreaClimb, AreaHit, LatLon } from "./types";

const SEARCH_DELAY_MS = 250;

export function useDebounced<T>(value: T, ms = SEARCH_DELAY_MS): T {
  const [settled, setSettled] = React.useState(value);
  React.useEffect(() => {
    const timer = setTimeout(() => setSettled(value), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);
  return settled;
}

/**
 * Areas by name, nearest first when the device location is known, or just nearby when nothing
 * is typed. With `within`, what is inside that area comes first, and its children when nothing
 * is typed.
 */
export function useAreaSearch(
  api: SendtallyApi,
  query: string,
  near: LatLon | null,
  {
    crags = false,
    enabled = true,
    within = null,
  }: { crags?: boolean; enabled?: boolean; within?: string | null } = {}
): AreaHit[] {
  const q = useDebounced(query.trim());
  const { state } = useQuery({
    ...queries.areaSearch(api, q, near, within),
    enabled: enabled && (q !== "" || near !== null || within !== null),
    placeholderData: keepPreviousData,
  });
  const found = state.status === "ready" ? state.data : [];
  return crags ? cragsOf(found) : found;
}

export type AreaClimbSearch = { found: AreaClimb[]; canAdd: boolean };

const NONE: AreaClimb[] = [];

/** Areas climbs by name, only in the session's crag once one is picked; every climb there when nothing is typed. */
export function useAreaClimbSearch(
  api: SendtallyApi,
  query: string,
  areaId: string | null,
  enabled: boolean
): AreaClimbSearch {
  const q = useDebounced(query.trim());
  const on = enabled && (q !== "" || areaId !== null);
  const { state } = useQuery({
    ...queries.areaClimbSearch(api, q, areaId),
    enabled: on,
    placeholderData: keepPreviousData,
  });
  const found = on && state.status === "ready" ? state.data : NONE;
  const settled = q === query.trim();
  return { found, canAdd: enabled && settled && canAddToAreas(query, found) };
}
