import React from "react";

export function Glyph({
  d,
  size = 15,
  width = 1.8,
  filled = false,
}: {
  d: string;
  size?: number;
  width?: number;
  filled?: boolean;
}): React.ReactElement {
  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      aria-hidden
      focusable="false"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flex: "none" }}
    >
      <path d={d} />
    </svg>
  );
}
