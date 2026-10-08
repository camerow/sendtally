import {
  addDays,
  clock,
  toLocalDate,
  toUnit,
  weekday,
  type CalendarDate,
  type HangKind,
  type PlanStatus,
  type Protocol,
  type Schedule,
  type TimeUnit,
  type TimeUnits,
  type WeightUnit,
} from "@sendtally/core/hang";
import { formatDate, formatNumber, t } from "../i18n";

const DAY_INDEXES = [0, 1, 2, 3, 4, 5, 6] as const;

// 2 Nov 2026 is a Monday, so offsetting it by a weekday number names that weekday.
const weekdayDate = (i: number): Date => new Date(2026, 10, 2 + i, 12);

export function weekdayShort(i: number): string {
  return formatDate(weekdayDate(i), { weekday: "short" });
}

export function weekdayLong(i: number): string {
  return formatDate(weekdayDate(i), { weekday: "long" });
}

/** One narrow letter per weekday, Monday first. */
export function weekdayLetters(): string[] {
  return DAY_INDEXES.map((i) => formatDate(weekdayDate(i), { weekday: "narrow" }));
}

/** "Fri 25 Sep" */
export function shortDate(d: CalendarDate): string {
  return formatDate(toLocalDate(d), { weekday: "short", day: "numeric", month: "short" });
}

/** "25 Sep" */
export function dayMonth(d: CalendarDate): string {
  return formatDate(toLocalDate(d), { day: "numeric", month: "short" });
}

/** "Friday 25 September" */
export function longDate(d: CalendarDate): string {
  return formatDate(toLocalDate(d), { weekday: "long", day: "numeric", month: "long" });
}

/** "Wednesday 30 Sep" */
export function dayTitle(d: CalendarDate): string {
  return `${weekdayLong(weekday(d))} ${dayMonth(d)}`;
}

/** "September 2026" */
export function monthTitle(d: CalendarDate): string {
  return formatDate(toLocalDate(d), { month: "long", year: "numeric" });
}

export function monthName(d: CalendarDate): string {
  return formatDate(toLocalDate(d), { month: "short" });
}

export function weekTitle(offset: number): string {
  if (offset === 0) return t("hang.weekThis");
  if (offset === -1) return t("hang.weekLast");
  if (offset === 1) return t("hang.weekNext");
  const count = Math.abs(offset);
  return offset < 0 ? t("hang.weeksAgo", { count }) : t("hang.weeksAhead", { count });
}

export function weekRange(start: CalendarDate): string {
  return `${dayMonth(start)} – ${dayMonth(addDays(start, 6))}`;
}

/** "Bodyweight", "+4 kg", "−15 kg" for hangs; "30 kg" for ground pulls. */
export function loadLabel(kind: HangKind, kg: number, unit: WeightUnit): string {
  const v = toUnit(kg, unit);
  if (kind === "pull") return t("hang.loadPlain", { value: formatNumber(v), unit });
  if (v === 0) return t("hang.bodyweight");
  return v > 0
    ? t("hang.loadPlus", { value: formatNumber(v), unit })
    : t("hang.loadMinus", { value: formatNumber(-v), unit });
}

/** "7s", or "29 min" from a minute up. */
export function humanDuration(seconds: number): string {
  return seconds < 60
    ? t("hang.seconds", { n: seconds })
    : t("hang.minutes", { n: Math.round(seconds / 60) });
}

function timeText(seconds: number, unit: TimeUnit): string {
  return unit === "min" ? clock(seconds, true) : t("hang.seconds", { n: seconds });
}

/** "6 × 7s on / 3s off · 6 sets · 3:00 rest" */
export function protocolSummary(p: Protocol, units: TimeUnits): string {
  const setRest = timeText(p.setRestS, units.setRestS);
  if (p.kind === "pull") return t("hang.summaryPull", { reps: p.reps, sets: p.sets, setRest });
  const on = timeText(p.hangS, units.hangS);
  const core =
    p.reps > 1
      ? t("hang.summaryRepeats", { reps: p.reps, on, off: timeText(p.restS, units.restS) })
      : t("hang.summarySingle", { on });
  return t("hang.summaryHang", { core, sets: p.sets, setRest });
}

export function kindLabel(kind: HangKind): string {
  return kind === "hang" ? t("hang.kindHang") : t("hang.kindPull");
}

export function planStatusLabel(status: PlanStatus): string {
  switch (status.kind) {
    case "starts":
      return t("hang.statusStarts", { date: shortDate(status.date) });
    case "ongoing":
      return t("hang.statusOngoing");
    case "week":
      return t("hang.statusWeek", { at: status.at, of: status.of });
    case "final":
      return t("hang.statusFinal", { of: status.of });
  }
}

export function planRange(s: Pick<Schedule, "start" | "end">): string {
  return s.end === null
    ? t("hang.rangeFrom", { date: dayMonth(s.start) })
    : t("hang.rangeTo", { from: dayMonth(s.start), to: dayMonth(addDays(s.end, -1)) });
}

export function daysList(days: readonly number[]): string {
  return days.map(weekdayShort).join(", ");
}

/** "HH:MM" as the locale writes a time of day. */
export function timeOfDay(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  return formatDate(new Date(2026, 0, 1, h ?? 8, m ?? 0), { hour: "numeric", minute: "2-digit" });
}
