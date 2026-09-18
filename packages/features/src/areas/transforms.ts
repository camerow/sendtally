import type { AreaClimbInput, AreaInput, GradeScales } from "@sendtally/api-client";
import { ApiError } from "@sendtally/api-client";
import { formatDate, formatNumber, t } from "../i18n";
import { scaleOptionsFor } from "../log-session/transforms";
import type {
  Area,
  AreaClimb,
  AreaClimbSession,
  AreaDraft,
  AreaFormValues,
  AreaSummary,
  ClimbFact,
  ClimbFormValues,
  ClimbSessionVM,
  ClimbType,
} from "./types";

export const CLIMB_TYPES: readonly ClimbType[] = ["boulder", "sport", "trad", "top_rope"];

const TYPE_KEYS = {
  boulder: "common.boulder",
  sport: "areas.typeSport",
  trad: "areas.typeTrad",
  top_rope: "areas.typeTopRope",
} as const;

export function climbTypeLabel(type: ClimbType): string {
  return t(TYPE_KEYS[type]);
}

export function areaClimbGradeLabel(climb: Pick<AreaClimb, "grade_value">): string {
  return climb.grade_value ?? "-";
}

export function isPending(item: { status: string; mine?: boolean }): boolean {
  return item.status === "pending" && item.mine !== false;
}

/** Only the facts the climb has; an unknown length is left out rather than shown as a dash. */
export function climbFacts(climb: AreaClimb): ClimbFact[] {
  const facts: Array<ClimbFact | null> = [
    { label: t("areas.type"), value: climbTypeLabel(climb.type) },
    { label: t("areas.grade"), value: areaClimbGradeLabel(climb) },
    climb.length_m === null
      ? null
      : { label: t("areas.length"), value: t("areas.metres", { n: formatNumber(climb.length_m) }) },
    climb.bolts === null ? null : { label: t("areas.bolts"), value: formatNumber(climb.bolts) },
    climb.first_ascent === null
      ? null
      : { label: t("areas.firstAscent"), value: climb.first_ascent },
  ];
  return facts.filter((f): f is ClimbFact => f !== null);
}

export function breadcrumbOf(ancestors: AreaSummary[]): AreaSummary[] {
  return [...ancestors].sort((a, b) => a.depth - b.depth);
}

export function climbSessionVMs(sessions: AreaClimbSession[]): ClimbSessionVM[] {
  return sessions.map((s) => ({
    fingerprint: s.fingerprint,
    title: s.name !== null && s.name !== "" ? s.name : t("sessions.loggedSession"),
    dateLabel: formatDate(new Date(s.start_at), {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    }),
    sent: s.sent,
  }));
}

/** The candidates a create answered 409 with, or null for any other failure. */
export function conflictCandidates<T>(error: unknown): T[] | null {
  if (!(error instanceof ApiError) || error.status !== 409) return null;
  const body = error.body as { candidates?: unknown } | null;
  return Array.isArray(body?.candidates) ? (body.candidates as T[]) : null;
}

export function defaultScale(type: ClimbType, scales: GradeScales): AreaClimb["grade_scale"] {
  return type === "boulder" ? scales.boulder : scales.route;
}

/** A type change keeps the scale when it still fits, since sport, trad and top rope share one. */
export function withType(
  values: ClimbFormValues,
  type: ClimbType,
  scales: GradeScales
): ClimbFormValues {
  const fits = scaleOptionsFor(type === "boulder" ? "boulder" : "route").includes(
    values.gradeScale
  );
  return fits
    ? { ...values, type }
    : { ...values, type, gradeScale: defaultScale(type, scales), grade: "" };
}

export function emptyClimbForm(scales: GradeScales, name = ""): ClimbFormValues {
  return {
    name,
    type: "boulder",
    gradeScale: scales.boulder,
    grade: "",
    lengthM: "",
    bolts: "",
    firstAscent: "",
    description: "",
  };
}

const text = (value: unknown): string =>
  value === null || value === undefined ? "" : String(value);

/** The climb as it is, with the caller's pending draft laid over it. */
export function climbFormOf(climb: AreaClimb, draft: AreaDraft | null = null): ClimbFormValues {
  const f = { ...climb, ...(draft?.proposed ?? {}) } as Record<string, unknown>;
  return {
    name: text(f["name"]),
    type: f["type"] as ClimbType,
    gradeScale: f["grade_scale"] as ClimbFormValues["gradeScale"],
    grade: text(f["grade_value"]),
    lengthM: text(f["length_m"]),
    bolts: text(f["bolts"]),
    firstAscent: text(f["first_ascent"]),
    description: text(f["description"]),
  };
}

export function areaFormOf(area: Area, draft: AreaDraft | null = null): AreaFormValues {
  const f = { ...area, ...(draft?.proposed ?? {}) } as Record<string, unknown>;
  return {
    name: text(f["name"]),
    description: text(f["description"]),
    lat: text(f["lat"]),
    lon: text(f["lon"]),
  };
}

const wholeNumber = (value: string): number | null => {
  const n = Number(value.trim());
  return value.trim() === "" || !Number.isInteger(n) ? null : n;
};

export function coordinate(value: string, limit: number): number | null {
  const n = Number(value.trim().replace(",", "."));
  return value.trim() === "" || !Number.isFinite(n) || Math.abs(n) > limit ? null : n;
}

export type ClimbFields = Omit<AreaClimbInput, "areaId" | "confirmedNew">;

export function climbFieldsOf(values: ClimbFormValues): ClimbFields {
  const route = values.type !== "boulder";
  return {
    name: values.name.trim(),
    type: values.type,
    gradeScale: values.gradeScale,
    grade: values.grade === "" ? null : values.grade,
    lengthM: route ? wholeNumber(values.lengthM) : null,
    bolts: values.type === "sport" ? wholeNumber(values.bolts) : null,
    firstAscent: values.firstAscent.trim() || null,
    description: values.description.trim() || null,
  };
}

export type AreaFields = Omit<AreaInput, "parentId" | "confirmedNew">;

/** Null when the coordinates are half filled or out of range, which the form reports. */
export function areaFieldsOf(values: AreaFormValues): AreaFields | null {
  const lat = coordinate(values.lat, 90);
  const lon = coordinate(values.lon, 180);
  const blank = values.lat.trim() === "" && values.lon.trim() === "";
  if (!blank && (lat === null || lon === null)) return null;
  return {
    name: values.name.trim(),
    description: values.description.trim() || null,
    lat,
    lon,
  };
}
