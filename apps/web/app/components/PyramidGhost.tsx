import React from "react";

/** Where a pyramid will be, on the dark ground, before there is a climb to draw. */
export function PyramidGhost(): React.ReactElement {
  return (
    <span className="pyramid-ghost">
      <i style={{ width: "26%" }} />
      <i style={{ width: "48%" }} />
      <i style={{ width: "74%" }} />
    </span>
  );
}
