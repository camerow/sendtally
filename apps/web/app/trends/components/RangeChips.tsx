import React from "react";
import { t } from "@sendtally/features/i18n";
import { trendRangeLabel, type TrendRange } from "@sendtally/features/trends";
import { chipStyle } from "../../components/chip";

const lockedChip: React.CSSProperties = {
  borderStyle: "dashed",
  color: "rgba(64,63,76,0.42)",
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
};

function LockGlyph(): React.ReactElement {
  return (
    <svg width="8" height="9" viewBox="0 0 8 9" aria-hidden="true">
      <rect
        x="0.75"
        y="3.75"
        width="6.5"
        height="4.5"
        rx="1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <path
        d="M2 3.75V2.5a2 2 0 0 1 4 0v1.25"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
      />
    </svg>
  );
}

export function RangeChips({
  ranges,
  range,
  onChange,
  isLocked = () => false,
  onLocked,
}: {
  ranges: readonly TrendRange[];
  range: TrendRange;
  onChange: (range: TrendRange) => void;
  isLocked?: (range: TrendRange) => boolean;
  onLocked?: () => void;
}): React.ReactElement {
  return (
    <div role="group" aria-label={t("trends.timeRange")} className="trend-ranges">
      {ranges.map((r) => {
        const locked = isLocked(r);
        return (
          <button
            key={r}
            type="button"
            onClick={() => (locked ? onLocked?.() : onChange(r))}
            aria-pressed={range === r}
            aria-label={locked ? t("common.membersOnly", { label: trendRangeLabel(r) }) : undefined}
            style={chipStyle(range === r, {
              height: 32,
              padding: "0 14px",
              ...(locked ? lockedChip : {}),
            })}
          >
            {locked && <LockGlyph />}
            {trendRangeLabel(r)}
          </button>
        );
      })}
    </div>
  );
}
