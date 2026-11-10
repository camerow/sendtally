import {
  boulderGradeFromV,
  climbGrade,
  convertGrade,
  disciplineOf,
  formatGrade,
  parseGrade,
  routeGradeFromIndex,
  type Discipline,
  type Grade,
  type GradedClimb,
} from "@sendtally/core";
import type { GradeScales, SessionRow } from "@sendtally/api-client";
import { formatNumber, t } from "../i18n";

export type { GradeScales };

/** Every grade the app shows goes through here, in the climber's scale for its discipline. */
export function displayGrade(grade: Grade, scales: GradeScales): string {
  return formatGrade(convertGrade(grade, scales[disciplineOf(grade.scale)]) ?? grade);
}

// Persisted labels are formatGrade output, whose case tells Font (6A) from French (6a).
function labelGrade(label: string): Grade | undefined {
  if (/^v/i.test(label)) return parseGrade("v", label);
  if (label.startsWith("5.")) return parseGrade("yds", label);
  return parseGrade(label === label.toUpperCase() ? "font" : "french", label);
}

/** A session row's persisted top grade label, or its V grade when the row predates labels. */
export function sessionGradeLabel(
  label: string | null,
  vGrade: number,
  scales: GradeScales
): string {
  const grade = label === null ? { scale: "v" as const, value: vGrade } : labelGrade(label);
  return grade === undefined ? (label ?? `V${vGrade}`) : displayGrade(grade, scales);
}

export type SessionGradeLabel = { kind: "sent" | "tried"; label: string };

export function sessionGradeLabels(session: SessionRow, scales: GradeScales): SessionGradeLabel[] {
  const out: SessionGradeLabel[] = [];
  if (session.top_send_grade >= 0) {
    const label = sessionGradeLabel(session.top_send_grade_label, session.top_send_grade, scales);
    out.push({ kind: "sent", label: t("sessions.sentGrade", { grade: label }) });
  }
  if (session.top_grade >= 0 && session.top_grade > session.top_send_grade) {
    const label = sessionGradeLabel(session.top_grade_label, session.top_grade, scales);
    out.push({ kind: "tried", label: t("sessions.triedGrade", { grade: label }) });
  }
  return out;
}

export type RouteScale = GradeScales["route"];

export function climbGradeLabel(c: GradedClimb, scales: GradeScales): string {
  return displayGrade(climbGrade(c), scales);
}

export type GradeFormatter = {
  discipline: Discipline;
  label: (rank: number) => string;
  average: (rank: number) => string;
};

/** Labels a rank on the grade ladder: a V grade for boulders, a route index for routes. */
export function gradeFormatter(discipline: Discipline, scales: GradeScales): GradeFormatter {
  if (discipline === "boulder" && scales.boulder === "v") {
    return {
      discipline,
      label: (rank) => (rank >= 0 ? `V${Math.round(rank)}` : "V?"),
      average: (rank) =>
        `V${formatNumber(rank, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`,
    };
  }
  const label = (rank: number): string => {
    const grade =
      discipline === "boulder"
        ? boulderGradeFromV(scales.boulder, Math.round(rank))
        : routeGradeFromIndex(scales.route, Math.round(rank));
    return grade === undefined ? "?" : formatGrade(grade);
  };
  return { discipline, label, average: label };
}
