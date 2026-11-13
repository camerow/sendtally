import React from "react";
import { letterOf } from "@sendtally/core/hang";

/** A dose's letter on its own colour, the same in the editor, the preview and the player. */
export function LetterBadge({ dose }: { dose: number }): React.ReactElement {
  return <span className={`letter-badge letter-badge--${dose % 4}`}>{letterOf(dose)}</span>;
}
