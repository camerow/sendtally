import type { CalendarDate } from "@sendtally/core/hang";

export const CALENDAR_PATH = "/app/plan/calendar";
export const ONGOING_PATH = "/app/plan/ongoing";
export const planDayPath = (date: CalendarDate): string => `/app/plan/day/${date}`;
