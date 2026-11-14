import React from "react";

/** How long a row just added stays lit. */
export const LIT_MS = 2400;

/** Rows just added, lit for a moment each time some are lit; starts with `initial` lit. */
export function useLit(
  initial: readonly string[] = []
): [readonly string[], (keys: readonly string[]) => void] {
  const [lit, setLit] = React.useState(initial);
  React.useEffect(() => {
    if (lit.length === 0) return;
    const fade = setTimeout(() => setLit([]), LIT_MS);
    return () => clearTimeout(fade);
  }, [lit]);
  return [lit, setLit];
}
