import type { ClimbSummary } from "@sendtally/api-client";
import { withTypedName } from "../areas/logForm";
import { findClimb } from "../climbs/transforms";
import { circuitGym, withCircuit, withoutCircuit } from "../gyms/draft";
import type { Gym } from "../gyms/types";
import { newClimbOfKind, type ClimbKind } from "./climbKind";
import { withClimbName, withPickedClimb } from "./liveSession";
import { nextClimbKey, withKnownArea } from "./transforms";
import type { ClimbArea, ClimbDraft, GradePrefs, LogSessionDraft } from "./types";

export function withClimb(
  draft: LogSessionDraft,
  key: string,
  patch: (climb: ClimbDraft) => ClimbDraft
): LogSessionDraft {
  return { ...draft, climbs: draft.climbs.map((c) => (c.key === key ? patch(c) : c)) };
}

/** Changing the gym re-places every climb: onto the new gym's first circuit, or off circuits. */
export function withGym(draft: LogSessionDraft, gym: Gym | null): LogSessionDraft {
  const at = circuitGym(gym);
  const first = at?.circuits[0];
  const { gymId: _was, ...rest } = draft;
  return {
    ...rest,
    ...(gym === null ? {} : { gymId: gym.id }),
    climbs: draft.climbs.map((c) =>
      at === null || first === undefined
        ? withoutCircuit(c)
        : withCircuit(c, at.circuits.find((x) => x.id === c.circuit?.id) ?? first, at)
    ),
  };
}

/** A new area drops a link to an Areas climb somewhere else. */
export function withClimbArea(climb: ClimbDraft, area: ClimbArea | null): ClimbDraft {
  const { area: was, ...rest } = climb;
  if (area === null) return rest;
  if (was?.id === area.id) return { ...rest, area };
  const { climbId: _link, ...unlinked } = rest;
  return { ...unlinked, area };
}

/** The next climb takes the kind last used, and outdoors the crag of the climb before it. */
export function nextFormClimb(
  draft: LogSessionDraft,
  kind: ClimbKind,
  prefs: GradePrefs,
  gyms: readonly Gym[]
): ClimbDraft {
  const previous = draft.climbs[draft.climbs.length - 1];
  const climb = newClimbOfKind(nextClimbKey(draft.climbs), kind, prefs, gyms, previous);
  return draft.location === "outdoor" && previous?.area !== undefined
    ? { ...climb, area: previous.area }
    : climb;
}

/** Marked by hand on this climb, else whether its name is one of the user's projects. */
export function isFormProject(climb: ClimbDraft, isProject: (name: string) => boolean): boolean {
  return climb.project ?? isProject(climb.name);
}

export function withProjectToggled(
  climb: ClimbDraft,
  isProject: (name: string) => boolean
): ClimbDraft {
  return { ...climb, project: !isFormProject(climb, isProject) };
}

/** Typing a name links the user's climb it matches and takes its grade. */
export function withTypedClimbName(
  climb: ClimbDraft,
  name: string,
  mine: readonly ClimbSummary[]
): ClimbDraft {
  return withClimbName(withTypedName(climb, name), name, findClimb(mine, name));
}

/** Picking a suggestion; outdoors it also takes the climb's crag. */
export function withSuggestedClimb(
  climb: ClimbDraft,
  known: ClimbSummary,
  outdoor: boolean
): ClimbDraft {
  const picked = withPickedClimb(withTypedName(climb, known.name), known);
  return outdoor ? withKnownArea(picked, known) : picked;
}
