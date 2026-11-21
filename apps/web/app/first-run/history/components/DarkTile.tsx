import React from "react";

export type DarkTileProps = {
  value: number | string | null;
  label: string;
  /** Shorter, for a card beside a form. */
  compact?: boolean;
};

/** A count over its word on the dark card, as Stats' tile is on white; dim until it has a value. */
export function DarkTile({ value, label, compact = false }: DarkTileProps): React.ReactElement {
  return (
    <div
      role="group"
      aria-label={`${value ?? "–"} ${label}`}
      className={compact ? "dark-tile dark-tile--compact" : "dark-tile"}
    >
      <span
        aria-hidden="true"
        className={value === null ? "dark-tile-value dark-tile-value--empty" : "dark-tile-value"}
      >
        {value ?? "–"}
      </span>
      <span aria-hidden="true" className="dark-tile-word">
        {label}
      </span>
    </div>
  );
}
