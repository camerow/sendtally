import React from "react";
import { NavigationContext, usePreventRemove } from "expo-router/react-navigation";
import { t } from "@sendtally/features/i18n";
import { confirmDestructive } from "./confirmDestructive";

/** Asks before unsaved changes are dropped. */
export function confirmDiscard(onConfirm: () => void): void {
  confirmDestructive({
    title: t("workouts.discardChangesTitle"),
    action: t("common.discard"),
    onConfirm,
  });
}

/**
 * Asks before a screen with unsaved changes is left, however it is left: Cancel, the swipe
 * back, Android's back. Returns `release`, which a save calls before it navigates away.
 */
export function useDiscardGuard(dirty: boolean): () => void {
  const navigation = React.useContext(NavigationContext);
  const released = React.useRef(false);
  usePreventRemove(dirty, ({ data }) => {
    const leave = (): void => navigation?.dispatch(data.action);
    if (released.current) leave();
    else confirmDiscard(leave);
  });
  return React.useCallback(() => {
    released.current = true;
  }, []);
}
