import type { TrainingBlock } from "@sendtally/api-client";
import {
  addDays,
  blockEnd,
  evenWeekLoads,
  minDate,
  resizeWeekLoads,
  type CalendarDate,
} from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import { shortDate } from "@sendtally/features/hang";
import type { BlockDraft } from "./types";

export const DEFAULT_BLOCK_WEEKS = 4;

export const MAX_BLOCK_WEEKS = 16;

export function blockDraft(block: TrainingBlock | null, today: CalendarDate): BlockDraft {
  const start = block?.start ?? today;
  const weeks = block?.weeks ?? DEFAULT_BLOCK_WEEKS;
  return {
    name: block?.name ?? t("plan.blockName"),
    start,
    minStart: block === null ? today : minDate(block.start, today),
    endMode: "weeks",
    weeks,
    last: addDays(start, weeks * 7 - 1),
    loads: block?.loads ?? evenWeekLoads(weeks),
    notes: block?.notes ?? "",
  };
}

/** A new week count, keeping each week's load and phase; null when out of range. */
export function withWeeks(draft: BlockDraft, weeks: number): Partial<BlockDraft> | null {
  if (!Number.isInteger(weeks) || weeks < 1 || weeks > MAX_BLOCK_WEEKS) return null;
  return { weeks, loads: resizeWeekLoads(draft.loads, weeks) };
}

/** The block a draft saves as, or null while it has no name. An ended block stays ended. */
export function blockOf(
  draft: BlockDraft,
  id: string,
  endedOn: CalendarDate | null
): TrainingBlock | null {
  const name = draft.name.trim();
  if (name === "") return null;
  const notes = draft.notes.trim();
  const block = {
    id,
    name,
    start: draft.start,
    weeks: draft.weeks,
    loads: draft.loads,
    notes: notes === "" ? null : notes,
    endedOn: null,
  };
  return {
    ...block,
    endedOn:
      endedOn !== null && endedOn < blockEnd(block) && endedOn > draft.start ? endedOn : null,
  };
}

export function blockSummary(draft: BlockDraft): string {
  const block = blockOf(draft, "", null);
  if (block === null) return t("plan.summaryName");
  return t("plan.blockSummary", {
    count: draft.weeks,
    start: shortDate(block.start),
    last: shortDate(addDays(blockEnd(block), -1)),
  });
}
