import * as Updates from "expo-updates";
import React from "react";
import { AppState } from "react-native";

const MIN_CHECK_INTERVAL_MS = 30 * 60_000;

/**
 * expo-updates only checks on a cold start, and phones keep apps alive for days. Checking again
 * when the app returns to the foreground downloads a newer update in the background, which is
 * what lets the app offer a restart instead of waiting for the next cold start.
 */
export function useUpdateCheckOnForeground(): void {
  React.useEffect(() => {
    if (!Updates.isEnabled) return;
    let lastCheck = Date.now();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active" || Date.now() - lastCheck < MIN_CHECK_INTERVAL_MS) return;
      lastCheck = Date.now();
      Updates.checkForUpdateAsync()
        .then((result) => (result.isAvailable ? Updates.fetchUpdateAsync() : null))
        .catch(() => null);
    });
    return () => subscription.remove();
  }, []);
}
