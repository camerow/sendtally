import React from "react";

const read = (key: string): boolean => {
  try {
    return localStorage.getItem(key) !== null;
  } catch {
    return false;
  }
};

/** Per-device "not now" for a prompt. `null` until hydrated, so the server never paints a row the browser then removes. */
export function useDismissed(key: string): { dismissed: boolean | null; dismiss: () => void } {
  const [dismissed, setDismissed] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage only exists after hydration
    setDismissed(read(key));
  }, [key]);

  const dismiss = React.useCallback((): void => {
    try {
      localStorage.setItem(key, new Date().toISOString());
    } catch {
      // A storage that refuses the write just shows the row again next visit.
    }
    setDismissed(true);
  }, [key]);

  return { dismissed, dismiss };
}
