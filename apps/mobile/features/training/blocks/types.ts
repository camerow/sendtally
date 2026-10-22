import type { WeekLoad } from "@sendtally/api-client";
import type { ScheduleDraft } from "../planner/types";

/** A block being made or changed; its dates are a Starts section and a week count. */
export type BlockDraft = ScheduleDraft & {
  name: string;
  loads: WeekLoad[];
  notes: string;
};
