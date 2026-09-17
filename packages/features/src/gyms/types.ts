import type { Circuit, CircuitColour, Gym, GymInput } from "@sendtally/api-client";

export type { Circuit, CircuitColour, Gym, GymInput };

export type GymScale = Gym["scale"];

/** What the gym editor holds: a full gym plus the id when it already exists. */
export type GymDraft = {
  id: string | null;
  name: string;
  scale: GymScale;
  circuits: Circuit[];
  walls: string[];
};

export type CircuitMode = "standard" | "custom";
