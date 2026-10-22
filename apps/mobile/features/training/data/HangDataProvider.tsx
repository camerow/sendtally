import React from "react";
import { Alert } from "react-native";
import { useHang, useHangActions } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { useApi } from "../../../lib/api";
import { HangDataContext } from "./HangDataContext";
import { LoadState } from "./LoadState";
import { useToday } from "./useToday";

const reportFailure = (): void => Alert.alert(t("hang.saveFailed"));

export type HangDataProviderProps = {
  children: React.ReactNode;
  /** What shows until the training data has loaded; a loading and retry state by default. */
  fallback?: React.ReactNode;
};

function Loader({ children, fallback }: HangDataProviderProps): React.ReactElement {
  const api = useApi();
  const { state, reload } = useHang(api);
  const actions = useHangActions(api, reportFailure);
  const today = useToday();
  const model = state.status === "ready" ? state.data : null;
  const value = React.useMemo(
    () => (model === null ? null : { model, actions, today }),
    [model, actions, today]
  );

  if (value === null)
    return <>{fallback === undefined ? <LoadState state={state} onRetry={reload} /> : fallback}</>;
  return <HangDataContext.Provider value={value}>{children}</HangDataContext.Provider>;
}

/**
 * Loads the signed-in user's hangboard training and hands it to everything below. Under
 * another provider it passes straight through, so a component can carry its own and still
 * nest inside a screen that already has one.
 */
export function HangDataProvider(props: HangDataProviderProps): React.ReactElement {
  const outer = React.useContext(HangDataContext);
  return outer === null ? <Loader {...props} /> : <>{props.children}</>;
}
