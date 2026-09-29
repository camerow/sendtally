import type { Protocol, TimeUnits, Workout } from "./types";

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

const library = (id: string, grip: BuiltInGrip, protocol: Protocol): Workout => ({
  ...protocol,
  id,
  grip,
  source: "library",
  timeUnits: DEFAULT_TIME_UNITS,
});

/**
 * The curated workout library, versioned with the app. An id is never reused;
 * sessions carry a protocol snapshot, so editing an entry never rewrites history.
 */
export const LIBRARY: readonly Workout[] = [
  library("rep73", "half", {
    name: "Repeaters 7:3",
    kind: "hang",
    edgeMm: 20,
    hangS: 7,
    restS: 3,
    reps: 6,
    sets: 6,
    setRestS: 180,
  }),
  library("max10", "half", {
    name: "Max hangs",
    kind: "hang",
    edgeMm: 20,
    hangS: 10,
    restS: 0,
    reps: 1,
    sets: 5,
    setRestS: 180,
  }),
  library("block", "pinch", {
    name: "Block pulls",
    kind: "pull",
    edgeMm: 0,
    hangS: 0,
    restS: 0,
    reps: 5,
    sets: 5,
    setRestS: 120,
  }),
  library("density", "open", {
    name: "Density hangs",
    kind: "hang",
    edgeMm: 20,
    hangS: 30,
    restS: 0,
    reps: 1,
    sets: 4,
    setRestS: 60,
  }),
  library("assist", "half", {
    name: "Assisted one-arm",
    kind: "hang",
    edgeMm: 20,
    hangS: 10,
    restS: 0,
    reps: 1,
    sets: 6,
    setRestS: 120,
  }),
  library("lowpull", "open", {
    name: "Light daily lifts",
    kind: "pull",
    edgeMm: 0,
    hangS: 0,
    restS: 0,
    reps: 10,
    sets: 3,
    setRestS: 90,
  }),
];

export const NEW_WORKOUT: Omit<Workout, "id"> = {
  name: "",
  source: "mine",
  kind: "hang",
  grip: "half",
  edgeMm: 20,
  hangS: 7,
  restS: 3,
  reps: 6,
  sets: 3,
  setRestS: 180,
  timeUnits: DEFAULT_TIME_UNITS,
};

export function protocolOf(w: Protocol): Protocol {
  const { name, kind, hangS, restS, reps, sets, setRestS, edgeMm } = w;
  return { name, kind, hangS, restS, reps, sets, setRestS, edgeMm };
}
