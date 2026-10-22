import type { CalendarDate, EndChoice, Schedule, Weekday } from "@sendtally/core/hang";

export type PlannerRequest =
  | {
      mode: "new";
      workoutId: string | null;
      gripId: string | null;
      days: Weekday[];
      start: CalendarDate;
    }
  | { mode: "edit"; schedule: Schedule };

export type EndMode = EndChoice["mode"];

/** The dates part of a plan: what the Starts and Ends sections read and change. */
export type ScheduleDraft = {
  start: CalendarDate;
  minStart: CalendarDate;
  endMode: EndMode;
  weeks: number;
  last: CalendarDate;
};

export type ScheduleForm = {
  draft: ScheduleDraft;
  update: (patch: Partial<ScheduleDraft>) => void;
  shaded: (d: CalendarDate) => boolean;
};
