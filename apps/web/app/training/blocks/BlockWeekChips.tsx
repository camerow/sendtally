import React from "react";
import { blockWeekOn, type Block, type CalendarDate } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";

const SCROLL_FROM = 9;

export type BlockWeekChipsProps = {
  block: Block;
  today: CalendarDate;
  /** The week picked, dark. */
  picked: number;
  onPick: (week: number) => void;
};

/**
 * W1 to the last week, sharing the row: the weeks gone on fern, the picked one dark, the rest
 * plain. Click one to show it. Nine weeks or more scroll, opened on the picked one.
 */
export function BlockWeekChips({
  block,
  today,
  picked,
  onPick,
}: BlockWeekChipsProps): React.ReactElement {
  const now =
    blockWeekOn(block, today) ??
    (block.start === null || today < block.start ? 0 : block.weeks + 1);
  const row = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    row.current
      ?.querySelector('[aria-pressed="true"]')
      ?.scrollIntoView({ block: "nearest", inline: "center" });
  }, []);
  const scrolls = block.weeks >= SCROLL_FROM;
  return (
    <div ref={row} className={scrolls ? "week-chips week-chips--scroll" : "week-chips"}>
      {Array.from({ length: block.weeks }, (_, i) => {
        const week = i + 1;
        const tone = week === picked ? " is-picked" : week < now ? " is-gone" : "";
        return (
          <button
            key={week}
            type="button"
            className={`week-chip${tone}`}
            aria-pressed={week === picked}
            aria-label={t("plan.weekNumber", { n: week })}
            onClick={() => onPick(week)}
          >
            {t("plan.weekShort", { n: week })}
          </button>
        );
      })}
    </div>
  );
}
