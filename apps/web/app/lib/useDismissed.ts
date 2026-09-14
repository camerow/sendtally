import React from "react";

const KEY = "sendtally:strava-setup:dismissed";

const read = (): boolean => {
  try {
    return localStorage.getItem(KEY) !== null;
  } catch {
    return false;
  }
};

/** Per-device "not now" for the Strava setup row. `null` until hydrated, so the server never paints a row the browser then removes. */
export function useDismissed(): { dismissed: boolean | null; dismiss: () => void } {
  const [dismissed, setDismissed] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage only exists after hydration
    setDismissed(read());
  }, []);

  const dismiss = React.useCallback((): void => {
    try {
      localStorage.setItem(KEY, new Date().toISOString());
    } catch {
      // A storage that refuses the write just shows the row again next visit.
    }
    setDismissed(true);
  }, []);

  return { dismissed, dismiss };
}
