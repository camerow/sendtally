import React from "react";

const never = (): (() => void) => () => {};
const onClient = (): boolean => true;
const onServer = (): boolean => false;

/** False through the server render and the hydrating one, true from then on. */
export function useHydrated(): boolean {
  return React.useSyncExternalStore(never, onClient, onServer);
}
