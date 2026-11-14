import React from "react";

/** The pyramid's two colours named: what went, and what did not yet. */
export function PyramidLegend({
  inner,
  outer,
}: {
  inner: string;
  outer: string;
}): React.ReactElement {
  return (
    <span className="pyramid-legend">
      <span className="pyramid-key">
        <span className="pyramid-swatch" />
        {inner}
      </span>
      <span className="pyramid-key">
        <span className="pyramid-swatch pyramid-swatch--soft" />
        {outer}
      </span>
    </span>
  );
}
