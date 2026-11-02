import { type Block, type CalendarDate, type Membership } from "@sendtally/core/hang";
import { shortDate } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { blockKicker } from "../blocks/blockText";

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
