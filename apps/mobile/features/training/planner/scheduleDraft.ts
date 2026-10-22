import { maxDate, type CalendarDate, type EndChoice } from "@sendtally/core/hang";
import type { ScheduleDraft } from "./types";

export const DEFAULT_WEEKS = 4;

export const endChoice = (d: ScheduleDraft): EndChoice =>
  d.endMode === "never"
    ? { mode: "never" }
    : d.endMode === "weeks"
      ? { mode: "weeks", weeks: d.weeks }
      : { mode: "date", last: d.last };

export const pickStart = (d: ScheduleDraft, start: CalendarDate): Partial<ScheduleDraft> => ({
  start,
  last: maxDate(d.last, start),
});
