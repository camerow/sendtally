import type { HangWorkout, Protocol, TimeUnits } from "./types";

/** Built-in grip ids. Stable forever: sessions and loads reference them. */
export const BUILT_IN_GRIPS = [
  "half",
  "full",
  "open",
  "drag",
  "sloper",
  "pinch",
  "front3",
  "back3",
  "front2",
  "middle2",
  "back2",
  "mono",
] as const;

export type BuiltInGrip = (typeof BUILT_IN_GRIPS)[number];

export const isBuiltInGrip = (id: string): id is BuiltInGrip =>
  (BUILT_IN_GRIPS as readonly string[]).includes(id);

export const DEFAULT_TIME_UNITS: TimeUnits = { hangS: "s", restS: "s", setRestS: "min" };

export const NEW_WORKOUT: Omit<HangWorkout, "id"> = {
  name: "",
  source: "mine",
  kind: "hang",
  grip: "half",
  hangS: 7,
  restS: 3,
  reps: 6,
  sets: 3,
  setRestS: 180,
  timeUnits: DEFAULT_TIME_UNITS,
};

export function protocolOf(w: Protocol): Protocol {
  const { name, kind, hangS, restS, reps, sets, setRestS } = w;
  return { name, kind, hangS, restS, reps, sets, setRestS };
}
