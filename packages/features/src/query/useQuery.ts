import {
  useQuery as useTanstackQuery,
  type QueryKey,
  type UseQueryOptions,
} from "@tanstack/react-query";
import React from "react";
import { ApiError } from "@sendtally/api-client";
import { t } from "../i18n";

export type QueryState<T> =
  { status: "loading" } | { status: "error"; message: string } | { status: "ready"; data: T };

export type Query<T> = {
  state: QueryState<T>;
  /** Set when a refetch failed and `state` is still showing the data from before it. */
  refreshFailed: boolean;
  reload: () => Promise<void>;
};

const messageOf = (error: Error): string => error.message || t("common.somethingWentWrong");

/**
 * Cached data wins over a failed or in-flight refetch, so a screen never blanks
 * what it already showed. A 404 is the exception: the row is gone, and showing
 * the cached copy would offer edits to something that no longer exists.
 */
export function useQuery<TFn, TData, K extends QueryKey>(
  options: UseQueryOptions<TFn, Error, TData, K>
): Query<TData> {
  const { data, error, refetch } = useTanstackQuery(options);
  const reload = React.useCallback(async () => {
    await refetch();
  }, [refetch]);
  const state = React.useMemo((): QueryState<TData> => {
    if (error instanceof ApiError && error.status === 404) {
      return { status: "error", message: messageOf(error) };
    }
    if (data !== undefined) return { status: "ready", data };
    if (error !== null) return { status: "error", message: messageOf(error) };
    return { status: "loading" };
  }, [data, error]);
  return { state, refreshFailed: data !== undefined && error !== null, reload };
}

/** Two reads a screen needs together: ready once both are, reloaded as one. */
export function useQueryPair<A, B, KA extends QueryKey, KB extends QueryKey>(
  a: UseQueryOptions<A, Error, A, KA>,
  b: UseQueryOptions<B, Error, B, KB>
): Query<[A, B]> {
  const { state: first, refreshFailed: firstFailed, reload: reloadFirst } = useQuery(a);
  const { state: second, refreshFailed: secondFailed, reload: reloadSecond } = useQuery(b);
  const state = React.useMemo((): QueryState<[A, B]> => {
    if (first.status !== "ready") return first;
    if (second.status !== "ready") return second;
    return { status: "ready", data: [first.data, second.data] };
  }, [first, second]);
  const reload = React.useCallback(async () => {
    await Promise.all([reloadFirst(), reloadSecond()]);
  }, [reloadFirst, reloadSecond]);
  return { state, refreshFailed: firstFailed || secondFailed, reload };
}
