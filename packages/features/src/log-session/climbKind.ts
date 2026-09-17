import { withCircuit, withoutCircuit } from "../gyms/draft";
import type { Gym } from "../gyms/types";
import type { DraftStorage } from "./draftStore";
import { disciplineOf, newClimb, withClimbDiscipline } from "./transforms";
import type { ClimbDraft, Discipline, GradePrefs } from "./types";

/** How a climb is graded: its discipline's scale, or a gym circuit. */
export type ClimbKind = Discipline | "circuit";

export function climbKindOf(climb: ClimbDraft): ClimbKind {
  return climb.circuit === undefined ? disciplineOf(climb.scale) : "circuit";
}

/** The kind last picked on this device; bouldering until one has been. */
export function readClimbKind(storage: DraftStorage): ClimbKind {
  const kind = storage.read();
  return kind === "route" || kind === "circuit" ? kind : "boulder";
}

/** The grading picker's value: a discipline, or the id of the climb's circuit. */
export function climbGradingValue(climb: ClimbDraft): string {
  return climb.circuit?.id ?? disciplineOf(climb.scale);
}

export function withClimbGrading(
  climb: ClimbDraft,
  value: string,
  prefs: GradePrefs,
  gym: Gym | null
): ClimbDraft {
  if (value === "boulder" || value === "route") {
    return withClimbDiscipline(withoutCircuit(climb), value, prefs);
  }
  const circuit = gym?.circuits.find((c) => c.id === value);
  return gym === null || circuit === undefined ? climb : withCircuit(climb, circuit, gym);
}

/**
 * A new climb of the kind last picked. A circuit climb goes on the previous climb's circuit, or
 * the gym's first; without the gym at hand it keeps the previous circuit as it was.
 */
export function newClimbOfKind(
  key: string,
  kind: ClimbKind,
  prefs: GradePrefs,
  gym: Gym | null,
  previous: ClimbDraft | undefined
): ClimbDraft {
  const fresh = newClimb(key, prefs[kind === "route" ? "route" : "boulder"]);
  if (kind !== "circuit") return fresh;
  const circuit = gym?.circuits.find((c) => c.id === previous?.circuit?.id) ?? gym?.circuits[0];
  if (gym !== null && circuit !== undefined) return withCircuit(fresh, circuit, gym);
  if (previous?.circuit === undefined) return fresh;
  return { ...fresh, scale: previous.scale, grade: previous.grade, circuit: previous.circuit };
}
