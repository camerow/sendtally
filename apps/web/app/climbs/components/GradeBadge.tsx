import React from "react";
import { CIRCUIT_HEX, type CircuitColour } from "@sendtally/features/gyms";

/**
 * A climb's grade in a soft box at the head of its row; white on a row that is soft itself.
 * A circuit climb's box is its circuit's colour instead, with no grade, as on the tally.
 */
export function GradeBadge({
  label,
  onSoft = false,
  colour,
}: {
  label: string;
  onSoft?: boolean;
  colour?: CircuitColour | undefined;
}): React.ReactElement {
  const className = onSoft ? "grade-badge grade-badge--on-soft" : "grade-badge";
  return colour === undefined ? (
    <span className={className}>{label}</span>
  ) : (
    <span
      className={colour === "white" ? `${className} grade-badge--white` : className}
      style={{ background: CIRCUIT_HEX[colour] }}
      aria-label={label}
    />
  );
}
