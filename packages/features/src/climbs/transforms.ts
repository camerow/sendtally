import type { ClimbSummary } from "@sendtally/api-client";
import { formatGrade, type Grade, type GradeScale } from "@sendtally/core";
import { convertGrade } from "../log-session/transforms";

export const MAX_CLIMB_SUGGESTIONS = 4;

export type ProjectStatus = "open" | "sent";

// The name is a climb's identity across sessions: the autocomplete, projects
// and the flash rate all match on it the same way.
export function climbKey(name: string): string {
  return name.trim().toLowerCase();
}

export function sameClimbName(a: string, b: string): boolean {
  return climbKey(a) === climbKey(b);
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

// A project added from the projects page has no grade until the climb turns up
// in a logged session, so the draft keeps whatever the user already picked.
export function climbDraftGrade(climb: ClimbSummary, scale: GradeScale): string {
  const stored: Grade | null = climb.grade;
  if (stored === null) return "";
  return convertGrade(formatGrade(stored), stored.scale, scale);
}

// Names of climbs the user had already logged before a session started - what
// separates a flash from a redpoint on that session's climb list.
export function climbsWorkedBefore(catalogue: ClimbSummary[], startAt: string): Set<string> {
  const start = Date.parse(startAt);
  return new Set(
    catalogue.filter((c) => Date.parse(c.first_at) < start).map((c) => climbKey(c.name))
  );
}

export function climbGradeLabel(climb: ClimbSummary): string {
  return climb.grade === null ? "-" : formatGrade(climb.grade);
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
