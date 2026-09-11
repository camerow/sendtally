import React from "react";

export type QueryState<T> =
  { status: "loading" } | { status: "error"; message: string } | { status: "ready"; data: T };

export function useQuery<T>(load: () => Promise<T>): {
  state: QueryState<T>;
  reload: () => void;
} {
  const [state, setState] = React.useState<QueryState<T>>({ status: "loading" });
  const [tick, setTick] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    load()
      .then((data) => {
        if (!cancelled) setState({ status: "ready", data });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState({
            status: "error",
            message: err instanceof Error ? err.message : "Something went wrong.",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [load, tick]);

  const reload = React.useCallback(() => {
    setState({ status: "loading" });
    setTick((t) => t + 1);
  }, []);

  return { state, reload };
}
