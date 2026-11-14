import React from "react";
import { entryKindLabel, type EntryKind } from "@sendtally/features/journal";

/** A journal entry's kind as a small chip. */
export function EntryKindChip({
  kind,
  onTint = false,
}: {
  kind: EntryKind;
  /** White, where the kind's own tint would sit on a tinted surface. */
  onTint?: boolean;
}): React.ReactElement {
  return (
    <span className={`entry-kind entry-kind--${kind}${onTint ? " entry-kind--on-tint" : ""}`}>
      {entryKindLabel(kind)}
    </span>
  );
}
