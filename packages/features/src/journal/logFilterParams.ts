import { FOCI, WORKOUT_KINDS } from "@sendtally/core/hang";
import { CLIMB_STATUSES, type GradeFilter } from "../climbs/log";
import { gradeOptions } from "../log-session/transforms";
import type { GradeScale } from "../log-session/types";
import { isYearRange, TREND_RANGES, type TrendRange } from "../trends/types";
import { NO_LOG_FILTER, updateLogFilter } from "./logFilter";
import { LOG_ROW_TYPES, type LogFilter } from "./types";

const KEYS = [
  "show",
  "when",
  "effort",
  "tags",
  "discipline",
  "grade",
  "status",
  "setting",
  "place",
  "category",
  "exercise",
  "block",
  "workout",
  "focus",
] as const;

const SCALES: readonly GradeScale[] = ["v", "font", "yds", "french"];

const listOf = <T extends string>(value: string | null, allowed: readonly T[]): T[] =>
  (value ?? "").split(",").filter((v): v is T => (allowed as readonly string[]).includes(v));

const oneOf = <T extends string>(value: string | null, allowed: readonly T[]): T | null =>
  listOf(value, allowed)[0] ?? null;

function whenOf(value: string | null): TrendRange {
  if (value === null) return "all";
  if ((TREND_RANGES as readonly string[]).includes(value)) return value as TrendRange;
  const range = value as TrendRange;
  return isYearRange(range) && /^y\d{4}$/.test(value) ? range : "all";
}

function effortOf(value: string | null): LogFilter["effort"] {
  const [lo, hi] = (value ?? "").split("-").map(Number);
  if (lo === undefined || hi === undefined || !(lo >= 1 && hi <= 10 && lo <= hi)) return null;
  return Number.isInteger(lo) && Number.isInteger(hi) ? { lo, hi } : null;
}

function gradeOf(value: string | null): GradeFilter | null {
  const [scale, from, to] = (value ?? "").split(":");
  const ladder = oneOf(scale ?? null, SCALES);
  if (ladder === null || from === undefined || to === undefined) return null;
  const grades = gradeOptions(ladder);
  return grades.includes(from) && grades.includes(to) ? { scale: ladder, from, to } : null;
}

const text = (value: string | null): string | null =>
  value === null || value.trim() === "" ? null : value;

/** Anything a link carries that it cannot read is left unset. `status` is the outcome, so /app?status=projects keeps working. */
export function logFilterFromParams(params: URLSearchParams): LogFilter {
  const show = listOf(params.get("show"), LOG_ROW_TYPES);
  return updateLogFilter(
    { ...NO_LOG_FILTER, show },
    {
      when: whenOf(params.get("when")),
      effort: effortOf(params.get("effort")),
      tags: (params.get("tags") ?? "").split(",").filter((s) => s !== ""),
      discipline: oneOf(params.get("discipline"), ["boulder", "route"] as const),
      grade: gradeOf(params.get("grade")),
      outcome: oneOf(params.get("status"), CLIMB_STATUSES) ?? "all",
      setting: oneOf(params.get("setting"), ["indoor", "outdoor"] as const),
      place: text(params.get("place")),
      categories: listOf(params.get("category"), WORKOUT_KINDS),
      exercise: text(params.get("exercise")),
      block: text(params.get("block")),
      workout: text(params.get("workout")),
      foci: listOf(params.get("focus"), FOCI),
    }
  );
}

function valuesOf(filter: LogFilter): Record<(typeof KEYS)[number], string> {
  const g = filter.grade;
  return {
    show: filter.show.join(","),
    when: filter.when === "all" ? "" : filter.when,
    effort: filter.effort === null ? "" : `${filter.effort.lo}-${filter.effort.hi}`,
    tags: filter.tags.join(","),
    discipline: filter.discipline ?? "",
    grade: g === null ? "" : `${g.scale}:${g.from}:${g.to}`,
    status: filter.outcome === "all" ? "" : filter.outcome,
    setting: filter.setting ?? "",
    place: filter.place ?? "",
    category: filter.categories.join(","),
    exercise: filter.exercise ?? "",
    block: filter.block ?? "",
    workout: filter.workout ?? "",
    focus: filter.foci.join(","),
  };
}

/** Writes the filter into the link's params, leaving every other param as it was. */
export function writeLogFilterParams(params: URLSearchParams, filter: LogFilter): void {
  const values = valuesOf(filter);
  for (const key of KEYS) {
    if (values[key] === "") params.delete(key);
    else params.set(key, values[key]);
  }
}
