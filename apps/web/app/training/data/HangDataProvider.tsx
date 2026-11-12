import React from "react";
import { useHang, useHangActions } from "@sendtally/features/hang";
import { useAppApi } from "../../lib/useAppApi";
import { HangDataContext } from "./HangDataContext";
import { LoadState } from "./LoadState";
import { useToday } from "./useToday";

export type HangDataProviderProps = {
  children: React.ReactNode;
  /** What shows until the training data has loaded; a loading and retry state by default. */
  fallback?: React.ReactNode;
};

function Loader({ children, fallback }: HangDataProviderProps): React.ReactElement {
  const api = useAppApi();
  const { state, reload } = useHang(api);
  const actions = useHangActions(api);
  const today = useToday();
  const model = state.status === "ready" ? state.data : null;
  const value = React.useMemo(
    () => (model === null ? null : { model, actions, today }),
    [model, actions, today]
  );

  if (value === null) return <>{fallback ?? <LoadState state={state} onRetry={reload} />}</>;
  return <HangDataContext.Provider value={value}>{children}</HangDataContext.Provider>;
}

/**
 * Loads the signed-in user's training and hands it to everything below. Under another
 * provider it passes straight through, so a component can carry its own and still nest
 * inside a page that already has one.
 */
export function HangDataProvider(props: HangDataProviderProps): React.ReactElement {
  const outer = React.useContext(HangDataContext);
  return outer === null ? <Loader {...props} /> : <>{props.children}</>;
}
