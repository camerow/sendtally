import React from "react";
import type { TrendGroupVM } from "@sendtally/features/trends";
import { TrendTile } from "./TrendTile";

export function TrendSection({
  group,
  onLockedLink,
}: {
  group: TrendGroupVM;
  onLockedLink?: () => void;
}): React.ReactElement {
  return (
    <section className="trend-section" aria-labelledby={`trend-${group.id}`}>
      <div className="trend-section-head">
        <div>
          <h2 id={`trend-${group.id}`}>{group.title}</h2>
          <p className="trend-section-insight">{group.insight}</p>
        </div>
        <span className="trend-section-question trend-mono">{group.question}</span>
      </div>
      <div className="trend-grid">
        {group.tiles.map((tile) => (
          <TrendTile key={tile.id} tile={tile} onLockedLink={onLockedLink} />
        ))}
      </div>
    </section>
  );
}
