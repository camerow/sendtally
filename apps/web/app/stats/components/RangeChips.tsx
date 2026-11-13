import React from "react";
import { t } from "@sendtally/features/i18n";
import {
  isLockedRange,
  trendRangeLabel,
  trendRanges,
  type TrendRange,
} from "@sendtally/features/trends";
import { Icon } from "../../components/Icon";

export type RangeChipsProps = {
  member: boolean | null;
  shown: TrendRange;
  onPick: (range: TrendRange) => void;
  /** Calendar years with anything logged in them, newest first, each a chip after All. */
  years: readonly number[];
  /** A locked chip calls this instead of being picked. */
  onLocked: () => void;
};

/** The ranges, longest first, in a row that scrolls; past the free one each wears a lock and opens the membership. */
export function RangeChips({
  member,
  shown,
  onPick,
  years,
  onLocked,
}: RangeChipsProps): React.ReactElement {
  const row = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const el = row.current;
    const chip = el?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (el && chip) el.scrollLeft = chip.offsetLeft - (el.clientWidth - chip.offsetWidth) / 2;
  }, [shown]);
  return (
    <div ref={row} role="group" aria-label={t("trends.timeRange")} className="range-chips">
      {trendRanges(years).map((range) => {
        const locked = isLockedRange(member, range);
        const label = trendRangeLabel(range);
        return (
          <button
            key={range}
            type="button"
            className={locked ? "range-chip range-chip--locked" : "range-chip"}
            aria-pressed={range === shown}
            aria-label={locked ? t("common.membersOnly", { label }) : undefined}
            onClick={() => (locked ? onLocked() : onPick(range))}
          >
            {locked && <Icon name="lock" size={11} strokeWidth={2.4} />}
            {label}
          </button>
        );
      })}
    </div>
  );
}
