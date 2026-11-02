import { onlineManager } from "@tanstack/react-query";
import React from "react";

/** Whether the phone has a connection, as expo-network tells TanStack Query's online manager. */
export function useOnline(): boolean {
  return React.useSyncExternalStore(
    (listener) => onlineManager.subscribe(listener),
    () => onlineManager.isOnline()
  );
}
