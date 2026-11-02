import React from "react";

const LIT_MS = 2500;

/** A plan just added, lit for a moment each time one arrives. */
export function useLit(highlight: string | undefined): string | undefined {
  const [lit, setLit] = React.useState(highlight);
  const [seen, setSeen] = React.useState(highlight);
  if (highlight !== seen) {
    setSeen(highlight);
    setLit(highlight);
  }
  React.useEffect(() => {
    const timer = setTimeout(() => setLit(undefined), LIT_MS);
    return () => clearTimeout(timer);
  }, [highlight]);
  return lit;
}
