import { withCircuit, withoutCircuit } from "../gyms/draft";
import type { Circuit, Gym } from "../gyms/types";
import type { DraftStorage } from "./draftStore";
import { asEnduranceClimb, withoutEndurance } from "./endurance";
import { disciplineOf, newClimb, withClimbDiscipline } from "./transforms";
import type { ClimbDraft, GradePrefs } from "./types";

/**
 * How a climb is logged: "boulder", "route", "endurance", or the id of a gym whose
 * circuits it is on.
 */
export type ClimbKind = string;

/** The gyms a climb can be put on a circuit at. */
export function circuitGyms(gyms: readonly Gym[]): Gym[] {
  return gyms.filter((g) => g.circuits.length > 0);
}

export function gymOfCircuit(gyms: readonly Gym[], circuitId: string | undefined): Gym | null {
  if (circuitId === undefined) return null;
  return gyms.find((g) => g.circuits.some((c) => c.id === circuitId)) ?? null;
}

export function climbKindOf(climb: ClimbDraft, gyms: readonly Gym[]): ClimbKind {
  if (climb.endurance !== undefined) return "endurance";
  return gymOfCircuit(gyms, climb.circuit?.id)?.id ?? disciplineOf(climb.scale);
}

/** The kind last picked on this device; bouldering until one has been, or once its gym is gone. */
export function readClimbKind(storage: DraftStorage, gyms: readonly Gym[]): ClimbKind {
  const kind = storage.read();
  if (kind === "route" || kind === "endurance") return kind;
  return kind !== null && gyms.some((g) => g.id === kind && g.circuits.length > 0)
    ? kind
    : "boulder";
}

function circuitFor(gym: Gym, previous: ClimbDraft | undefined): Circuit | undefined {
  return gym.circuits.find((c) => c.id === previous?.circuit?.id) ?? gym.circuits[0];
}

/** Moves a climb between disciplines and gyms; onto a gym it keeps its circuit if that gym has it. */
export function withClimbKind(
  climb: ClimbDraft,
  kind: ClimbKind,
  prefs: GradePrefs,
  gyms: readonly Gym[]
): ClimbDraft {
  if (kind === "endurance") return asEnduranceClimb(withoutCircuit(climb));
  if (kind === "boulder" || kind === "route") {
    return withClimbDiscipline(withoutEndurance(withoutCircuit(climb)), kind, prefs);
  }
  const gym = gyms.find((g) => g.id === kind);
  const circuit = gym === undefined ? undefined : circuitFor(gym, climb);
  if (gym === undefined || circuit === undefined) return climb;
  return withCircuit(withoutEndurance(climb), circuit, gym);
}

/** A new climb of the kind last picked; a circuit climb goes on the previous climb's circuit, or the gym's first. */
export function newClimbOfKind(
  key: string,
  kind: ClimbKind,
  prefs: GradePrefs,
  gyms: readonly Gym[],
  previous: ClimbDraft | undefined
): ClimbDraft {
  const fresh = newClimb(key, prefs[kind === "route" ? "route" : "boulder"]);
  if (kind === "endurance") return asEnduranceClimb(fresh);
  const gym = gyms.find((g) => g.id === kind);
  const circuit = gym === undefined ? undefined : circuitFor(gym, previous);
  return gym === undefined || circuit === undefined ? fresh : withCircuit(fresh, circuit, gym);
}
