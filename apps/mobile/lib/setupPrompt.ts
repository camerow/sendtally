import * as SecureStore from "expo-secure-store";
import React from "react";

/** Per-device "not now" for a setup card. `null` until the store has answered. */
export function useSetupDismissed(key: string): { dismissed: boolean | null; dismiss: () => void } {
  const storeKey = `${key}-setup-dismissed`;
  const [dismissed, setDismissed] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    SecureStore.getItemAsync(storeKey)
      .then((value) => {
        if (!cancelled) setDismissed(value !== null);
      })
      .catch(() => {
        if (!cancelled) setDismissed(false);
      });
    return () => {
      cancelled = true;
    };
  }, [storeKey]);

  const dismiss = React.useCallback((): void => {
    setDismissed(true);
    void SecureStore.setItemAsync(storeKey, new Date().toISOString()).catch(() => undefined);
  }, [storeKey]);

  return { dismissed, dismiss };
}
