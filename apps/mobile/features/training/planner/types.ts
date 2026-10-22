import type { CalendarDate, Schedule, Weekday } from "@sendtally/core/hang";

export type PlannerRequest =
  | {
      mode: "new";
      workoutId: string | null;
      gripId: string | null;
      days: Weekday[];
      start: CalendarDate;
    }
  | { mode: "edit"; schedule: Schedule };
