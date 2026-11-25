import React from "react";

/** How long a step ignores taps after it opens: the second tap of a double tap on the footer before it. */
export const SETTLE_MS = 600;

/**
 * A footer action that fires once, so a double tap cannot run it twice; with `settleMs`
 * it also ignores a tap in the moment its step opens, for a footer in the place of the one before it.
 */
export function useOnePress(settleMs = 0): (action: () => void) => () => void {
  const fired = React.useRef(false);
  const opened = React.useRef(0);
  React.useEffect(() => {
    opened.current = Date.now();
  }, []);
  return (action) => () => {
    if (fired.current || Date.now() - opened.current < settleMs) return;
    fired.current = true;
    action();
  };
}
