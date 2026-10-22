import { BLOCK_PHASES, blockEnd, type BlockPhase, type TrainingBlock } from "@sendtally/core/hang";
import { z } from "zod";
import { calendarDate } from "./activities";
import * as repo from "./repo";
import type { TrainingBlockRow } from "./repo";

export const MAX_BLOCK_WEEKS = 16;

export const trainingBlockBody = z
  .object({
    name: z.string().trim().min(1).max(80),
    start: calendarDate,
    weeks: z.number().int().min(1).max(MAX_BLOCK_WEEKS),
    phases: z.array(z.enum(BLOCK_PHASES)),
    notes: z.string().trim().max(2000).nullable(),
    endedOn: calendarDate.nullable(),
  })
  .refine((b) => b.phases.length === b.weeks, "one phase per week")
  .refine((b) => b.endedOn === null || b.endedOn > b.start, "ended before it started");

export const blockEndBody = z.object({ date: calendarDate });

export type TrainingBlockInput = z.infer<typeof trainingBlockBody>;

export function trainingBlockOf(row: TrainingBlockRow): TrainingBlock {
  return {
    id: row.id,
    name: row.name,
    start: row.start,
    weeks: row.weeks,
    phases: JSON.parse(row.phases_json) as BlockPhase[],
    notes: row.notes,
    endedOn: row.ended_on,
  };
}

type Dated = { blockId?: string | null; start: string; end: string | null };

/** A member planned on its block's dates, or null when the block is not the user's. */
export async function inBlock<T extends Dated>(
  db: D1Database,
  userId: string,
  plan: T
): Promise<T | null> {
  if (plan.blockId === undefined || plan.blockId === null) return plan;
  const row = await repo.getTrainingBlock(db, userId, plan.blockId);
  if (row === null) return null;
  const block = trainingBlockOf(row);
  return { ...plan, start: block.start, end: blockEnd(block) };
}
