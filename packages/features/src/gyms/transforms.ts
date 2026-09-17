import { boulderGradeFromV, formatGrade, parseGrade } from "@sendtally/core";
import { t } from "../i18n";
import type { Circuit, CircuitColour, Gym, GymDraft, GymScale } from "./types";

export const CIRCUIT_COLOURS: readonly CircuitColour[] = [
  "red",
  "orange",
  "yellow",
  "green",
  "blue",
  "purple",
  "black",
  "white",
];

/** The one colour library every gym draws from; the hex is the display value on both platforms. */
export const CIRCUIT_HEX: Record<CircuitColour, string> = {
  red: "#E84855",
  orange: "#F28C28",
  yellow: "#F9DC5C",
  green: "#2E9E6B",
  blue: "#3185FC",
  purple: "#7E3FF2",
  black: "#35343F",
  white: "#FFFFFF",
};

export const MAX_CIRCUIT_GRADE = 17;

const STANDARD: ReadonlyArray<readonly [CircuitColour, number, number]> = [
  ["green", 0, 0],
  ["yellow", 1, 2],
  ["orange", 3, 4],
  ["red", 4, 6],
  ["purple", 6, 7],
  ["black", 8, 10],
  ["white", 11, 12],
];

export function circuitId(): string {
  return `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function standardCircuits(): Circuit[] {
  return STANDARD.map(([colour, low, high]) => ({ id: circuitId(), colour, label: "", low, high }));
}

export function customStart(): Circuit[] {
  return [{ id: circuitId(), colour: "green", label: "", low: 0, high: 1 }];
}

/** The next circuit continues the ladder, in the next colour the standard ladder would use. */
export function nextCircuit(circuits: readonly Circuit[]): Circuit {
  const last = circuits[circuits.length - 1];
  const low = last === undefined ? 0 : Math.min(MAX_CIRCUIT_GRADE, last.high + 1);
  const used = new Set(circuits.map((c) => c.colour));
  const colour =
    STANDARD.map(([c]) => c).find((c) => !used.has(c)) ??
    CIRCUIT_COLOURS.find((c) => !used.has(c)) ??
    "green";
  return { id: circuitId(), colour, label: "", low, high: Math.min(MAX_CIRCUIT_GRADE, low + 1) };
}

export function colourName(colour: CircuitColour): string {
  return t(`gyms.colour.${colour}`);
}

/** A circuit is called what the climber typed, else its colour. */
export function circuitLabel(circuit: Pick<Circuit, "colour" | "label">): string {
  const label = circuit.label.trim();
  return label === "" ? colourName(circuit.colour) : label;
}

/** Scored as the middle of the range, rounded down on an even span. */
export function circuitMiddle(circuit: Pick<Circuit, "low" | "high">): number {
  return Math.floor((circuit.low + circuit.high) / 2);
}

export function gradeLabel(v: number, scale: GymScale): string {
  const grade = boulderGradeFromV(scale, v);
  return grade === undefined ? `V${v}` : formatGrade(grade);
}

export function circuitRangeLabel(circuit: Pick<Circuit, "low" | "high">, scale: GymScale): string {
  if (circuit.low === circuit.high) return gradeLabel(circuit.low, scale);
  return `${gradeLabel(circuit.low, scale)}–${gradeLabel(circuit.high, scale)}`;
}

/** Every grade a circuit spans, as draft grade strings, for the felt-like picker. */
export function circuitGrades(circuit: Pick<Circuit, "low" | "high">, scale: GymScale): string[] {
  const out: string[] = [];
  for (let v = circuit.low; v <= circuit.high; v += 1) out.push(gradeLabel(v, scale));
  return out;
}

export function vGradeOfLabel(label: string, scale: GymScale): number | null {
  const grade = parseGrade(scale, label);
  if (grade === undefined) return null;
  if (grade.scale === "v") return grade.value;
  for (let v = 0; v <= MAX_CIRCUIT_GRADE; v += 1) {
    const candidate = boulderGradeFromV(scale, v);
    if (candidate !== undefined && formatGrade(candidate) === formatGrade(grade)) return v;
  }
  return null;
}

export function circuitRef(circuit: Circuit): { id: string; label: string; colour: CircuitColour } {
  return { id: circuit.id, label: circuitLabel(circuit), colour: circuit.colour };
}

export function findCircuit(gym: Gym | null, id: string | undefined): Circuit | null {
  if (gym === null || id === undefined) return null;
  return gym.circuits.find((c) => c.id === id) ?? null;
}

export function emptyGymDraft(): GymDraft {
  return { id: null, name: "", scale: "v", circuits: standardCircuits(), walls: [] };
}

export function gymDraftOf(gym: Gym): GymDraft {
  return {
    id: gym.id,
    name: gym.name,
    scale: gym.scale,
    circuits: [...gym.circuits],
    walls: [...gym.walls],
  };
}

export function withCircuitRange(circuit: Circuit, key: "low" | "high", value: number): Circuit {
  const v = Math.max(0, Math.min(MAX_CIRCUIT_GRADE, value));
  const next = { ...circuit, [key]: v };
  if (next.low > next.high) return key === "low" ? { ...next, high: v } : { ...next, low: v };
  return next;
}

export function gymDraftProblem(draft: GymDraft): string | null {
  if (draft.name.trim() === "") return t("gyms.needName");
  if (draft.circuits.length === 0) return t("gyms.needCircuit");
  return null;
}

/** Walls dedupe case-insensitively, keeping the first spelling. */
export function withWall(walls: readonly string[], wall: string): string[] {
  const name = wall.trim();
  if (name === "" || walls.some((w) => w.toLowerCase() === name.toLowerCase())) return [...walls];
  return [...walls, name];
}

export function withoutWall(walls: readonly string[], wall: string): string[] {
  return walls.filter((w) => w !== wall);
}
