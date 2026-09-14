import * as SecureStore from "expo-secure-store";
import React from "react";

const DISMISSED_KEY = "strava-setup-dismissed";

/** Per-device "not now" for the Strava setup row. `null` until the store has answered. */
export function useStravaSetupDismissed(): { dismissed: boolean | null; dismiss: () => void } {
  const [dismissed, setDismissed] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    SecureStore.getItemAsync(DISMISSED_KEY)
      .then((value) => {
        if (!cancelled) setDismissed(value !== null);
      })
      .catch(() => {
        if (!cancelled) setDismissed(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const dismiss = React.useCallback((): void => {
    setDismissed(true);
    void SecureStore.setItemAsync(DISMISSED_KEY, new Date().toISOString()).catch(() => undefined);
  }, []);

  return { dismissed, dismiss };
}
