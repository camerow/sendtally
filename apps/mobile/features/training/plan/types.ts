import type { PlanItem, PlanKind } from "@sendtally/api-client";
import type { CalendarDate, Weekday } from "@sendtally/core/hang";
import type { PlannerRequest, ScheduleDraft } from "../planner/types";

/** What the Plan training chooser offers: a hangboard workout, or any plan item kind. */
export type PlanChoice = "hang" | PlanKind;

export type PlanItemRequest =
  | { mode: "new"; kind: PlanKind; days: Weekday[]; start: CalendarDate }
  | { mode: "edit"; item: PlanItem };

/** Which planning sheet is up: the chooser, the hangboard planner, or a plan item's form. */
export type PlanRequest =
  | { mode: "choose"; days: Weekday[]; start: CalendarDate }
  | { mode: "hang"; request: PlannerRequest }
  | { mode: "item"; request: PlanItemRequest };

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
};
