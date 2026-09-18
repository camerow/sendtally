import type { ClimbSummary, GradeScales } from "@sendtally/api-client";
import { MAX_CLIMB_SUGGESTIONS, sameClimbName } from "../climbs/transforms";
import { convertGrade, disciplineOf, draftGrade, withClimbScale } from "../log-session/transforms";
import type { ClimbDraft } from "../log-session/types";
import { emptyClimbForm } from "./transforms";
import type { AreaClimb, AreaSummary, ClimbFormValues } from "./types";

/** A row in the climb name dropdown: a name from the user's own history, or a climb in Areas. */
export type ClimbOption =
  | { kind: "mine"; climb: ClimbSummary }
  | { kind: "areas"; climb: AreaClimb; project: boolean; logged: boolean };

/**
 * The user's own matches keep their place, but one that is also in Areas is offered as
 * the Areas climb so picking it links the row. Areas climbs the user has not logged follow.
 */
export function climbOptions(
  mine: ClimbSummary[],
  found: AreaClimb[],
  linkedId?: string
): ClimbOption[] {
  const inAreas = found.filter((c) => c.id !== linkedId);
  const own = mine.map((climb): ClimbOption => {
    const match = inAreas.find((c) => sameClimbName(c.name, climb.name));
    return match === undefined
      ? { kind: "mine", climb }
      : { kind: "areas", climb: match, project: climb.project, logged: true };
  });
  const rest = inAreas
    .filter((c) => !mine.some((m) => sameClimbName(m.name, c.name)))
    .map((climb): ClimbOption => ({ kind: "areas", climb, project: false, logged: false }));
  return [...own, ...rest].slice(0, MAX_CLIMB_SUGGESTIONS + 2);
}

/** The add row is offered for a typed name Areas does not already have. */
export function canAddToAreas(query: string, found: AreaClimb[]): boolean {
  return query.trim() !== "" && !found.some((c) => sameClimbName(c.name, query));
}

/** A crag is somewhere to climb, so a region is never offered as one. */
export function cragsOf(found: AreaSummary[]): AreaSummary[] {
  return found.filter((a) => a.region_code === null);
}

/** Picking an Areas climb links the row and takes its grade, in the row's scale when it can. */
export function withAreaClimb(climb: ClimbDraft, picked: AreaClimb): ClimbDraft {
  const linked: ClimbDraft = {
    ...climb,
    name: picked.name,
    climbId: picked.id,
    project: undefined,
  };
  if (picked.grade_value === null) return linked;
  if (disciplineOf(picked.grade_scale) === disciplineOf(climb.scale)) {
    return {
      ...linked,
      grade: convertGrade(picked.grade_value, picked.grade_scale, climb.scale),
    };
  }
  return { ...withClimbScale(linked, picked.grade_scale), grade: picked.grade_value };
}

/** Retyping the name means it is no longer the climb that was picked. */
export function withTypedName(climb: ClimbDraft, name: string): ClimbDraft {
  const { climbId: _unlinked, ...rest } = climb;
  return { ...rest, name };
}

/** The add-climb form opens on what the row already says: its name, discipline and grade. */
export function climbFormFromDraft(climb: ClimbDraft, scales: GradeScales): ClimbFormValues {
  const route = disciplineOf(climb.scale) === "route";
  return {
    ...emptyClimbForm(scales, climb.name.trim()),
    type: route ? "sport" : "boulder",
    gradeScale: climb.scale,
    grade: draftGrade(climb.grade, climb.scale) === undefined ? "" : climb.grade,
  };
}
