import type { HangWorkout, Protocol, TimeUnits } from "./types";

/** Built-in grip ids. Stable forever: sessions and loads reference them. */
export const BUILT_IN_GRIPS = [
  "half",
  "full",
  "open",
  "drag",
  "sloper",
  "pinch",
  "front2",
  "back2",
] as const;

export type BuiltInGrip = (typeof BUILT_IN_GRIPS)[number];

/** English names, for server-side text such as a Strava description. Apps translate by id. */
export const BUILT_IN_GRIP_NAMES: Record<BuiltInGrip, string> = {
  half: "Half crimp",
  full: "Full crimp",
  open: "Open hand",
  drag: "3-finger drag",
  sloper: "Sloper",
  pinch: "Pinch",
  front2: "Front 2",
  back2: "Back 2",
};

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
