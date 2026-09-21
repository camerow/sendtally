import type { ClimbDraft } from "../log-session/types";
import { circuitMiddle, circuitRef, gradeLabel } from "./transforms";
import type { Circuit, Gym } from "./types";

/** Putting a climb on a circuit scores it at the circuit's middle in the gym's scale. */
export function withCircuit(climb: ClimbDraft, circuit: Circuit, gym: Gym): ClimbDraft {
  return {
    ...climb,
    scale: gym.scale,
    grade: gradeLabel(circuitMiddle(circuit), gym.scale),
    circuit: circuitRef(circuit),
  };
}

export function withoutCircuit(climb: ClimbDraft): ClimbDraft {
  const { circuit: _circuit, wall: _wall, ...rest } = climb;
  return rest;
}

/** The gym a draft is at, if it still exists. */
export function gymOfDraft(gyms: readonly Gym[], gymId: string | undefined): Gym | null {
  if (gymId === undefined) return null;
  return gyms.find((g) => g.id === gymId) ?? null;
}

/** The gym a live session shows and logs circuits against: the one picked on the draft, never a default. */
export function liveGymOfDraft(gyms: readonly Gym[], gymId: string | undefined): Gym | null {
  return circuitGym(gymOfDraft(gyms, gymId));
}

/** Circuit logging needs a gym with circuits; a gym without any behaves like no gym. */
export function circuitGym(gym: Gym | null): Gym | null {
  return gym !== null && gym.circuits.length > 0 ? gym : null;
}
