import React from "react";
import { t } from "@sendtally/features/i18n";
import { trendRangeLabel, trendRanges, type TrendRange } from "@sendtally/features/trends";

export type RangeChipsProps = {
  shown: TrendRange;
  onPick: (range: TrendRange) => void;
  /** Calendar years with anything logged in them, newest first, each a chip after All. */
  years: readonly number[];
};

/** The ranges, longest first, in a row that scrolls. */
export function RangeChips({ shown, onPick, years }: RangeChipsProps): React.ReactElement {
  const row = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    row.current
      ?.querySelector<HTMLElement>('[aria-pressed="true"]')
      ?.scrollIntoView?.({ inline: "center", block: "nearest" });
  }, [shown]);
  return (
    <div ref={row} role="group" aria-label={t("trends.timeRange")} className="range-chips chip-row">
      {trendRanges(years).map((range) => (
        <button
          key={range}
          type="button"
          className="range-chip"
          aria-pressed={range === shown}
          onClick={() => onPick(range)}
        >
          {trendRangeLabel(range)}
        </button>
      ))}
    </div>
  );
}
