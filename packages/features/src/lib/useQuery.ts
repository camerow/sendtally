import React from "react";
import { t } from "../i18n";

export type QueryState<T> =
  { status: "loading" } | { status: "error"; message: string } | { status: "ready"; data: T };

// ponytail: process-wide last-result cache per key, keyed on the api object so a sign-out
// (new client) starts cold. Swap for react-query if invalidation rules grow beyond "refetch".
const cache = new WeakMap<object, Map<string, unknown>>();

/** `load` is a dependency of the fetching effect, so callers must memoise it -
 * an inline function would re-fetch on every render. With `cacheKey`, the last result for
 * that key on `owner` renders immediately while a fresh load runs. */
export function useQuery<T>(
  load: () => Promise<T>,
  cacheKey?: { owner: object; key: string }
): {
  state: QueryState<T>;
  reload: () => void;
} {
  const cached = cacheKey
    ? (cache.get(cacheKey.owner)?.get(cacheKey.key) as T | undefined)
    : undefined;
  const [state, setState] = React.useState<QueryState<T>>(
    cached === undefined ? { status: "loading" } : { status: "ready", data: cached }
  );
  const [tick, setTick] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    load()
      .then((data) => {
        if (cacheKey) {
          const bucket = cache.get(cacheKey.owner) ?? new Map<string, unknown>();
          bucket.set(cacheKey.key, data);
          cache.set(cacheKey.owner, bucket);
        }
        if (!cancelled) setState({ status: "ready", data });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState({
            status: "error",
            message: err instanceof Error ? err.message : t("common.somethingWentWrong"),
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [load, tick]);

  const reload = React.useCallback(() => {
    if (!cacheKey) setState({ status: "loading" });
    setTick((t) => t + 1);
  }, [cacheKey]);

  return { state, reload };
}
