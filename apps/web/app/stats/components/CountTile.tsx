import React from "react";

/** A number or grade over a word: one of the four tiles on Stats > Climbing. */
export function CountTile({
  value,
  label,
}: {
  value: number | string;
  label: string;
}): React.ReactElement {
  return (
    <div className="count-tile" role="group" aria-label={`${value} ${label}`}>
      <span className="count-tile-value">{value}</span>
      <span className="count-tile-label">{label}</span>
    </div>
  );
}
