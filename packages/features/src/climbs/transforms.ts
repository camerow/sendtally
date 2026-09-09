import type { ClimbSummary } from "@sendtally/api-client";
import { formatGrade, type Grade, type GradeScale } from "@sendtally/core";
import { convertGrade } from "../log-session/transforms";

export const MAX_CLIMB_SUGGESTIONS = 6;

export type ProjectStatus = "open" | "sent";

export function sameClimbName(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

export function findClimb(climbs: ClimbSummary[], name: string): ClimbSummary | undefined {
  return name.trim() === "" ? undefined : climbs.find((c) => sameClimbName(c.name, name));
}

export function matchClimbs(climbs: ClimbSummary[], query: string): ClimbSummary[] {
  const q = query.trim().toLowerCase();
  if (q === "") return climbs.slice(0, MAX_CLIMB_SUGGESTIONS);
  return climbs
    .filter((c) => c.name.toLowerCase().includes(q) && !sameClimbName(c.name, query))
    .slice(0, MAX_CLIMB_SUGGESTIONS);
}

export function climbDraftGrade(climb: ClimbSummary, scale: GradeScale): string {
  const stored: Grade = climb.grade;
  return convertGrade(formatGrade(stored), stored.scale, scale);
}

export function climbGradeLabel(climb: ClimbSummary): string {
  return formatGrade(climb.grade);
}

export function projectStatus(climb: ClimbSummary): ProjectStatus {
  return climb.sends > 0 ? "sent" : "open";
}

export function projectsOf(climbs: ClimbSummary[]): ClimbSummary[] {
  return climbs
    .filter((c) => c.project)
    .sort(
      (a, b) =>
        Number(projectStatus(a) === "sent") - Number(projectStatus(b) === "sent") ||
        b.last_at.localeCompare(a.last_at)
    );
}

export function projectMetaLabel(climb: ClimbSummary): string {
  const sessions = `${climb.sessions} ${climb.sessions === 1 ? "SESSION" : "SESSIONS"}`;
  const attempts = `${climb.attempts} ${climb.attempts === 1 ? "ATTEMPT" : "ATTEMPTS"}`;
  return `${sessions} · ${attempts}`;
}
