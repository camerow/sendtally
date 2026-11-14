import React from "react";
import { useLit as useSharedLit } from "@sendtally/features/training";

/** A plan just added, lit for a moment each time one arrives. */
export function useLit(highlight: string | undefined): string | undefined {
  const [lit, light] = useSharedLit(highlight === undefined ? [] : [highlight]);
  const [seen, setSeen] = React.useState(highlight);
  if (highlight !== seen) {
    setSeen(highlight);
    light(highlight === undefined ? [] : [highlight]);
  }
  return lit[0];
}
