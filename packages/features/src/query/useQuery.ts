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
export function useQuery<T, K extends QueryKey>(
  options: UseQueryOptions<T, Error, T, K>
): Query<T> {
  const { data, error, refetch } = useTanstackQuery(options);
  const reload = React.useCallback(async () => {
    await refetch();
  }, [refetch]);
  const state = React.useMemo((): QueryState<T> => {
    if (error instanceof ApiError && error.status === 404) {
      return { status: "error", message: messageOf(error) };
    }
    if (data !== undefined) return { status: "ready", data };
    if (error !== null) return { status: "error", message: messageOf(error) };
    return { status: "loading" };
  }, [data, error]);
  return { state, refreshFailed: data !== undefined && error !== null, reload };
}

export function bothReady<A, B, R>(
  a: QueryState<A>,
  b: QueryState<B>,
  join: (a: A, b: B) => R
): QueryState<R> {
  if (a.status !== "ready") return a;
  if (b.status !== "ready") return b;
  return { status: "ready", data: join(a.data, b.data) };
}
