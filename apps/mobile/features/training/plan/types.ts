import type { ActivityDetail, PlanItem, PlanKind, TrainingBlock } from "@sendtally/api-client";
import type { CalendarDate, Weekday } from "@sendtally/core/hang";
import type { PlannerRequest, ScheduleDraft } from "../planner/types";

/** What the Plan training chooser offers: a hangboard workout, any plan item kind, or something new to plan. */
export type PlanChoice = "hang" | PlanKind | "newWorkout" | "newTemplate";

export type PlanItemRequest =
  | {
      mode: "new";
      kind: PlanKind;
      days: Weekday[];
      start: CalendarDate;
      blockId?: string;
      template?: ActivityDetail;
    }
  | { mode: "edit"; item: PlanItem };

/** Which planning sheet is up: the chooser, the hangboard planner, a plan item's form, or a block's. */
export type PlanRequest =
  | { mode: "choose"; days: Weekday[]; start: CalendarDate; blockId?: string }
  | { mode: "hang"; request: PlannerRequest }
  | { mode: "item"; request: PlanItemRequest }
  | { mode: "block"; block: TrainingBlock | null };

export type ScheduleMode = "days" | "perWeek";

export type PlanItemDraft = ScheduleDraft & {
  kind: PlanKind;
  title: string;
  mode: ScheduleMode;
  days: Weekday[];
  perWeek: number;
  minutes: number | null;
  targetRpe: number | null;
  projectId: string | null;
  /** Edited as a body, so it shares the activity form's editors; saved without `done`. */
  template: ActivityDetail | null;
  blockId: string | null;
};
