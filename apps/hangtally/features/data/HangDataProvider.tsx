import React from "react";
import { Alert } from "react-native";
import { useHang, useHangActions } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { useApi } from "../../lib/api";
import { useToday } from "../../lib/useToday";
import { ThemeProvider } from "../../theme/ThemeContext";
import { HangDataContext } from "./HangDataContext";
import { LoadState } from "./LoadState";

// Every write is already on screen when it is sent, so a failure only needs
// saying out loud; the actions refetch to put the screen back.
const reportFailure = (): void => Alert.alert(t("hang.saveFailed"));

/** Loads the signed-in user's training once and hands it, themed, to every screen below. */
export function HangDataProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const api = useApi();
  const { state, reload } = useHang(api);
  const actions = useHangActions(api, reportFailure);
  const today = useToday();
  const model = state.status === "ready" ? state.data : null;
  const value = React.useMemo(
    () => (model === null ? null : { model, actions, today }),
    [model, actions, today]
  );

  if (value === null) return <LoadState state={state} onRetry={reload} />;
  return (
    <ThemeProvider name={value.model.settings.theme}>
      <HangDataContext.Provider value={value}>{children}</HangDataContext.Provider>
    </ThemeProvider>
  );
}
