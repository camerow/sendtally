import { boulderGradeFromV, formatGrade } from "@sendtally/core";
import { z } from "zod";
import type { GymRow } from "./repo";

export const CIRCUIT_COLOURS = [
  "red",
  "orange",
  "yellow",
  "green",
  "blue",
  "purple",
  "black",
  "white",
] as const;

export type CircuitColour = (typeof CIRCUIT_COLOURS)[number];

const circuitSchema = z
  .object({
    id: z.string().min(1).max(40),
    colour: z.enum(CIRCUIT_COLOURS),
    label: z.string().trim().max(40).default(""),
    low: z.number().int().min(0).max(17),
    high: z.number().int().min(0).max(17),
  })
  .refine((c) => c.low <= c.high, "range is backwards");

export const gymBody = z.object({
  name: z.string().trim().min(1).max(80),
  scale: z.enum(["v", "font"]).default("v"),
  circuits: z.array(circuitSchema).max(30).default([]),
  walls: z.array(z.string().trim().min(1).max(40)).max(60).default([]),
});

export type GymInput = z.input<typeof gymBody>;
export type Circuit = z.infer<typeof circuitSchema>;

export type Gym = {
  id: string;
  name: string;
  scale: "v" | "font";
  circuits: Circuit[];
  walls: string[];
};

export function gymOf(row: GymRow): Gym {
  return {
    id: row.id,
    name: row.name,
    scale: row.scale,
    circuits: JSON.parse(row.circuits_json) as Circuit[],
    walls: JSON.parse(row.walls_json) as string[],
  };
}

export function dedupedWalls(walls: string[]): string[] {
  const seen = new Set<string>();
  return walls.filter((w) => {
    const key = w.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// The middle of a circuit's range, rounded down on an even span: the grade a
// climb on it scores as unless the climber said how it felt.
export function circuitMiddle(circuit: { low: number; high: number }): number {
  return Math.floor((circuit.low + circuit.high) / 2);
}

export function circuitRangeLabel(
  circuit: { low: number; high: number },
  scale: "v" | "font"
): string {
  const label = (v: number): string => {
    const grade = boulderGradeFromV(scale, v);
    return grade === undefined ? `V${v}` : formatGrade(grade);
  };
  if (circuit.low === circuit.high) return label(circuit.low);
  return `${label(circuit.low)}–${label(circuit.high)}`;
}
