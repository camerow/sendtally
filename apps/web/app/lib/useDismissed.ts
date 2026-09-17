import { useAuth } from "@clerk/react-router";
import React from "react";

const read = (key: string): boolean => {
  try {
    return localStorage.getItem(key) !== null;
  } catch {
    return false;
  }
};

/**
 * Per-user, per-browser "not now" for a setup card. `null` until hydrated, so the server never
 * paints a card the browser then removes. Keyed on the user so another account signing in on
 * the same browser still gets offered it.
 */
export function useDismissed(name: string): { dismissed: boolean | null; dismiss: () => void } {
  const { userId } = useAuth();
  const key = `sendtally:${userId ?? "anon"}:${name}-setup:dismissed`;
  const [dismissed, setDismissed] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage only exists after hydration
    setDismissed(read(key));
  }, [key]);

  const dismiss = React.useCallback((): void => {
    try {
      localStorage.setItem(key, new Date().toISOString());
    } catch {
      // A storage that refuses the write just shows the card again next visit.
    }
    setDismissed(true);
  }, [key]);

  return { dismissed, dismiss };
}
