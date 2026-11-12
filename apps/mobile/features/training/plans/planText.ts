import {
  blockEnded,
  blockWeekOn,
  type Block,
  type CalendarDate,
  type Membership,
} from "@sendtally/core/hang";
import { dayMonth, shortDate } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { blockKicker } from "@sendtally/features/training";

/** Where a membership stands: its block's week, when it starts, or ongoing. */
export function membershipTag(m: Membership, block: Block | null, today: CalendarDate): string {
  if (block !== null) return blockKicker(block, today);
  return m.start > today
    ? t("hang.statusStarts", { date: shortDate(m.start) })
    : t("hang.statusOngoing");
}

/** The one date a one-off lands on; nothing for a weekly plan, whose days its week row shows. */
export function oneOffDate(m: Pick<Membership, "weekdays" | "start" | "blockId">): string[] {
  return m.weekdays.length === 0 && m.blockId === null ? [shortDate(m.start)] : [];
}

const startsOn = (start: CalendarDate): string => t("hang.statusStarts", { date: dayMonth(start) });

/** Where a workout is planned: the block, Ongoing or the day, and what is worth saying of it. */
export function plannedIn(
  m: Membership,
  block: Block | null,
  today: CalendarDate
): { name: string; meta: string } {
  if (block !== null) {
    const name = block.name || t("plan.untitled");
    if (block.start === null || blockEnded(block, today)) return { name, meta: "" };
    const at = blockWeekOn(block, today);
    return {
      name,
      meta: at === null ? startsOn(block.start) : t("plan.blockWeek", { at, of: block.weeks }),
    };
  }
  const [day] = oneOffDate(m);
  if (day !== undefined) return { name: day, meta: "" };
  return { name: t("plan.ongoing"), meta: m.start > today ? startsOn(m.start) : "" };
}
