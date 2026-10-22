import type { ActivityDetail, PlanItem, PlanKind, TrainingBlock } from "@sendtally/api-client";
import type { CalendarDate, Weekday } from "@sendtally/core/hang";
import type { LibraryWorkout } from "@sendtally/features/workouts";
import type { PlannerRequest, ScheduleDraft } from "../planner/types";

/** What the Plan training chooser offers: a library workout, a hangboard workout, any plan item kind, or something new to plan. */
export type PlanChoice = "library" | "hang" | PlanKind | "newWorkout" | "newTemplate";

export type PlanItemRequest =
  | {
      mode: "new";
      kind: PlanKind;
      days: Weekday[];
      start: CalendarDate;
      blockId?: string;
      template?: ActivityDetail;
      /** A library workout it runs. */
      workout?: LibraryWorkout;
    }
  | { mode: "edit"; item: PlanItem };

/** Where a new plan lands: on these weekdays from this date, in this block if any. */
export type PlanAt = { days: Weekday[]; start: CalendarDate; blockId?: string };

/** Which planning sheet is up: the chooser, the library, the hangboard planner, a plan item's form, or a block's. */
export type PlanRequest =
  | ({ mode: "choose" } & PlanAt)
  | ({ mode: "library" } & PlanAt)
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
  /** The library workout it runs; while set, `template` is that workout's body as picked. */
  workoutId: string | null;
  blockId: string | null;
};
