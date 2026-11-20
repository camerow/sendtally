import {
  clock,
  isPullSetup,
  isTimed,
  toLocalDate,
  type CalendarDate,
  type GripSetup,
  type HangKind,
  type HangSetup,
  type Protocol,
  type TimeUnit,
  type TimeUnits,
  type WeightUnit,
} from "@sendtally/core/hang";
import { formatDate, formatNumber, t } from "../i18n";
import { loadLabel } from "./weights";

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

/** "Wednesday, Sep 30" */
export function dayTitle(d: CalendarDate): string {
  return formatDate(toLocalDate(d), { weekday: "long", day: "numeric", month: "short" });
}

/** "September 2026" */
export function monthTitle(d: CalendarDate): string {
  return formatDate(toLocalDate(d), { month: "long", year: "numeric" });
}

export function weekTitle(offset: number): string {
  if (offset === 0) return t("hang.weekThis");
  if (offset === -1) return t("hang.weekLast");
  if (offset === 1) return t("hang.weekNext");
  const count = Math.abs(offset);
  return offset < 0 ? t("hang.weeksAgo", { count }) : t("hang.weeksAhead", { count });
}

/** "20 mm · +4 kg" on a hang; a ground pull's weight alone. */
export function setupLabel(kind: HangKind, setup: HangSetup, unit: WeightUnit): string {
  const load = loadLabel(kind, setup.loadKg, unit);
  return kind === "hang" ? `${t("hang.edgeMm", { n: setup.edgeMm })} · ${load}` : load;
}

/** "20 mm · 10s" for a hang setup; "Ground pull" for the one setup pulls have. */
export function gripSetupLabel(setup: GripSetup): string {
  return isPullSetup(setup)
    ? t("hang.kindPull")
    : `${t("hang.edgeMm", { n: setup.edgeMm })} · ${t("hang.seconds", { n: setup.hangS })}`;
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

/** A protocol's parts in order, "6 × 7s on / 3s off", "3 sets", "2:00 rest", which a summary joins. */
export function protocolParts(p: Protocol, units: TimeUnits): string[] {
  const setRest = timeText(p.setRestS, units.setRestS);
  if (!isTimed(p))
    return [
      t("hang.partPullSets", { reps: p.reps, sets: p.sets }),
      t("hang.partBetweenSets", { setRest }),
    ];
  const on = timeText(p.hangS, units.hangS);
  const core =
    p.reps > 1
      ? t("hang.summaryRepeats", { reps: p.reps, on, off: timeText(p.restS, units.restS) })
      : t(p.kind === "hang" ? "hang.summarySingle" : "hang.summaryTimedPull", { on });
  return [core, t("hang.partSets", { sets: p.sets }), t("hang.partRest", { setRest })];
}

/** "6 × 7s on / 3s off · 6 sets · 3:00 rest" */
export const protocolSummary = (p: Protocol, units: TimeUnits): string =>
  protocolParts(p, units).join(" · ");

export function daysList(days: readonly number[]): string {
  return days.map(weekdayShort).join(", ");
}

/** "HH:MM" as the locale writes a time of day. */
export function timeOfDay(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  return formatDate(new Date(2026, 0, 1, h ?? 8, m ?? 0), { hour: "numeric", minute: "2-digit" });
}

/** "3-5" for a count with a top above it, else the count alone. */
export const countText = (min: number, max: number | undefined): string =>
  max === undefined || max <= min ? formatNumber(min) : `${formatNumber(min)}-${formatNumber(max)}`;
