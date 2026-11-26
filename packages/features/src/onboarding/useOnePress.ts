import React from "react";

/** How long a step ignores taps after it opens: the second tap of a double tap on the footer before it. */
const SETTLE_MS = 600;

type Press = { preventDefault: () => void };

/**
 * A footer action that fires once, so a double tap cannot run it twice; with `settle`
 * it also ignores a tap in the moment its step opens, for a footer in the place of the one before it.
 * An ignored press on a link does not follow it.
 */
export function useOnePress(settle = false): (action: () => void) => (press?: Press) => void {
  const fired = React.useRef(false);
  const opened = React.useRef(0);
  React.useEffect(() => {
    opened.current = Date.now();
  }, []);
  return (action) => (press) => {
    if (fired.current || (settle && Date.now() - opened.current < SETTLE_MS))
      return press?.preventDefault();
    fired.current = true;
    action();
  };
}
