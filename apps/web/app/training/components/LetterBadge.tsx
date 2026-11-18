import React from "react";
import { letterOf } from "@sendtally/core/hang";

/** A dose's letter on its own colour, the same in the editor, the preview and the player. */
export function LetterBadge({
  dose,
  plain = false,
}: {
  dose: number;
  /** One colour for every letter, where the letter names a place, not a dose taking turns. */
  plain?: boolean;
}): React.ReactElement {
  return (
    <span className={`letter-badge letter-badge--${plain ? 0 : dose % 4}`}>{letterOf(dose)}</span>
  );
}
