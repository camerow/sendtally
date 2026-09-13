import React from "react";
const RANGE_CHIPS = ["1M", "3M", "6M", "YTD", "1Y", "ALL"];

export type RangeChipsProps = {
  active: string;
  size?: "sm" | "md";
};

export function RangeChips({ active, size = "md" }: RangeChipsProps): React.ReactElement {
  return (
    <div className="l-chips" role="presentation">
      {RANGE_CHIPS.map((chip) => (
        <span
          key={chip}
          className={[
            "l-chip",
            size === "sm" ? "l-chip--sm" : "",
            chip === active ? "l-chip--on" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {chip}
        </span>
      ))}
    </div>
  );
}
