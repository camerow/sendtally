import {
  climbDiscipline,
  climbGrade,
  formatGrade,
  routeGradeFromIndex,
  type Discipline,
  type GradedClimb,
} from "@sendtally/core";
import type { SessionRow } from "@sendtally/api-client";

export type SessionGradeLabel = { kind: "sent" | "tried"; label: string };

export function sessionGradeLabels(session: SessionRow): SessionGradeLabel[] {
  const out: SessionGradeLabel[] = [];
  if (session.top_send_grade >= 0) {
    const label = session.top_send_grade_label ?? `V${session.top_send_grade}`;
    out.push({ kind: "sent", label: `SENT ${label}` });
  }
  if (session.top_grade >= 0 && session.top_grade > session.top_send_grade) {
    const label = session.top_grade_label ?? `V${session.top_grade}`;
    out.push({ kind: "tried", label: `TRIED ${label}` });
  }
  return out;
}

export type RouteScale = "yds" | "french";

export function climbGradeLabel(c: GradedClimb): string {
  return formatGrade(climbGrade(c));
}

export function routeScaleOf(climbs: readonly GradedClimb[]): RouteScale {
  let yds = 0;
  let french = 0;
  for (const c of climbs) {
    const scale = climbGrade(c).scale;
    if (scale === "yds") yds++;
    else if (scale === "french") french++;
  }
  return french > yds ? "french" : "yds";
}

export type GradeFormatter = {
  discipline: Discipline;
  label: (rank: number) => string;
  average: (rank: number) => string;
};

export function gradeFormatter(discipline: Discipline, routeScale: RouteScale): GradeFormatter {
  if (discipline === "boulder") {
    return {
      discipline,
      label: (rank) => (rank >= 0 ? `V${Math.round(rank)}` : "V?"),
      average: (rank) => `V${rank.toFixed(1)}`,
    };
  }
  const label = (rank: number): string => {
    const grade = routeGradeFromIndex(routeScale, Math.round(rank));
    return grade === undefined ? "?" : formatGrade(grade);
  };
  return { discipline, label, average: label };
}

export function gradeFormatterFor(
  climbs: readonly GradedClimb[],
  discipline: Discipline
): GradeFormatter {
  return gradeFormatter(
    discipline,
    routeScaleOf(climbs.filter((c) => climbDiscipline(c) === "route"))
  );
}
