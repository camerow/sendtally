import { afterEach, describe, expect, it } from "vitest";
import type { HangData } from "@sendtally/api-client";
import { setLocale } from "../i18n";
import { libraryOf } from "../workouts/library";
import type { LibraryWorkout } from "../workouts/types";
import { hangModel, hangsWithParts, hangWorkoutOf, renameClash } from "./model";
import { canCompareGrips, compareGrips, gripMeta, gripSessionRows, newBestOf } from "./progress";

afterEach(() => setLocale("en"));

const data = (overrides: Partial<HangData> = {}): HangData => ({
  grips: [
    { id: "g1", name: "Pocket", custom: true, hidden: true },
    { id: "g2", name: "Pocket 2", custom: true, hidden: false },
  ],
  defaultGrips: {},
  loads: {},
  sessions: [],
  parts: [],
  settings: {
    units: "kg",
    theme: "moss",
    reminders: false,
    reminderTime: "08:00",
    postToStrava: false,
    reminderPromptSeen: true,
  },
  strava: { connected: false },
  ...overrides,
});

const mine: LibraryWorkout = {
  id: "w1",
  source: "mine",
  kind: "hangboard",
  name: "Garage repeaters",
  description: "",
  minutes: null,
  targetRpe: null,
  items: [{ exercise: "g1", doses: [{ sets: 3, reps: 6, onS: 7, offS: 3, edgeMm: 18 }] }],
  exerciseRestS: 180,
  focus: null,
};

const model = (overrides: Partial<HangData> = {}) =>
  hangModel(data(overrides), [...libraryOf([]), mine]);

describe("grips", () => {
  it("reads a built-in's measure and archive from its row, under its own translated name", () => {
    setLocale("de");
    const row = {
      id: "open",
      name: "Open hand",
      custom: false,
      hidden: true,
      measure: "repsWeight" as const,
    };
    const grips = model({ grips: [row] }).grips;
    expect(grips.filter((g) => g.id === "open")).toEqual([
      { id: "open", name: "Offene Hand", custom: false, hidden: true, measure: "repsWeight" },
    ]);
  });
});

describe("renameClash", () => {
  it("lets a rename take a deleted grip's name", () => {
    expect(renameClash(model().grips, "g2", "pocket")).toBeUndefined();
  });

  it("blocks a visible grip's name, but not the grip's own", () => {
    const { grips } = model();
    expect(renameClash(grips, "g1", "POCKET 2")?.id).toBe("g2");
    expect(renameClash(grips, "g2", "pocket 2")).toBeUndefined();
  });

  it("blocks a built-in under its shown name and its English one", () => {
    setLocale("de");
    const { grips } = model();
    expect(renameClash(grips, "g2", "offene hand")?.id).toBe("open");
    expect(renameClash(grips, "g2", "Open hand")).toMatchObject({
      id: "open",
      name: "Offene Hand",
    });
  });
});

describe("hang workouts", () => {
  it("runs every hangboard workout in the library by its first item, and nothing else", () => {
    const { workouts } = model();
    expect(workouts.map((w) => w.id)).toContain("rep73");
    expect(workouts.map((w) => w.id)).toContain("w1");
    expect(workouts.map((w) => w.id)).not.toContain("strength-5x5");
    expect(model().workout("w1")).toEqual({
      id: "w1",
      source: "mine",
      name: "Garage repeaters",
      kind: "hang",
      grip: "g1",
      hangS: 7,
      restS: 3,
      reps: 6,
      sets: 3,
      setRestS: 0,
      timeUnits: { hangS: "s", restS: "s", setRestS: "s" },
    });
  });

  it("runs a workout's first item at its first dose, and nothing without one", () => {
    const fingers = libraryOf([]).find((w) => w.id === "fingers-ab");
    expect(fingers === undefined ? null : hangWorkoutOf(fingers)).toMatchObject({
      reps: 1,
      hangS: 10,
      sets: 6,
    });
    expect(hangWorkoutOf({ ...mine, items: [] })).toBeNull();
  });

  it("runs the dose a later session takes, in turn", () => {
    const fingers = libraryOf([]).find((w) => w.id === "fingers-ab");
    const at = (session: number): unknown =>
      fingers === undefined ? null : hangWorkoutOf(fingers, session);
    expect(at(1)).toMatchObject({ reps: 6, hangS: 7, restS: 3, sets: 3 });
    expect(at(2)).toMatchObject({ reps: 1, hangS: 10, sets: 6 });
  });
});

describe("defaultGrip", () => {
  it("skips a deleted grip a workout was created with", () => {
    const m = model();
    const workout = m.workout("w1")!;
    expect(m.defaultGrip(workout)).toBe("half");
    expect(m.defaultGrip({ ...workout, grip: "g2" })).toBe("g2");
  });
});

describe("setup", () => {
  const session = {
    id: "h1",
    workoutId: "rep73",
    gripId: "half",
    date: "2026-10-01",
    edgeMm: 20,
    loadKg: 6,
    pct: 100,
    misses: 0,
    rpe: null,
    protocol: {
      name: "R",
      kind: "hang" as const,
      hangS: 7,
      restS: 3,
      reps: 6,
      sets: 6,
      setRestS: 0,
    },
    membershipId: null,
    week: null,
    focus: null,
    done: [],
    stravaActivityId: null,
    postState: null,
    postError: null,
    updatedAt: "t",
  };

  it("takes what the plan prescribes, filling gaps from the last session", () => {
    const m = model({ sessions: [session] });
    const rep73 = m.workout("rep73")!;
    expect(m.setup(rep73, "half", { edgeMm: 15 })).toEqual({ edgeMm: 15, loadKg: 6 });
    expect(m.setup(rep73, "half", { weightKg: 2.5 })).toEqual({ edgeMm: 20, loadKg: 2.5 });
    expect(m.setup(rep73, "half")).toEqual({ edgeMm: 20, loadKg: 6 });
  });

  it("falls back to a legacy load, then the default", () => {
    const m = model({ loads: { "w1:open": -4 } });
    const w1 = m.workout("w1")!;
    const rep73 = m.workout("rep73")!;
    expect(m.setup(w1, "open")).toEqual({ edgeMm: 20, loadKg: -4 });
    expect(m.setup(rep73, "open")).toEqual({ edgeMm: 20, loadKg: 0 });
    expect(m.lastUsed(rep73, "open")).toBeNull();
    expect(m.lastUsed(w1, "open")).toEqual({ edgeMm: 20, loadKg: -4 });
    expect(m.lastUsed(w1, "half")).toBeNull();
  });

  it("reads a workout's fingerboard part for its grips, newest first, and never as a workout of its own", () => {
    const part = { ...session, id: "p1", date: "2026-10-05", workoutId: "", activityId: "a1" };
    const m = model({ sessions: [session], parts: [part] });
    expect(m.sessions.map((s) => s.id)).toEqual(["p1", "h1"]);
    expect(hangsWithParts({ sessions: [session], parts: [part] })).toEqual(m.sessions);
    expect(m.setup(m.workout("rep73")!, "half")).toEqual({ edgeMm: 20, loadKg: 6 });
  });
});

describe("a later grip, read as a run of that grip", () => {
  const protocol = {
    name: "Max hangs",
    kind: "hang" as const,
    hangS: 10,
    restS: 0,
    reps: 1,
    sets: 2,
    setRestS: 180,
  };
  const open = (weightKg: number, reps = 1) => ({
    item: 1,
    exercise: "open",
    dose: { sets: 2, reps: 1, onS: 10, edgeMm: 20 },
    sets: [
      { reps: 1, onS: 10, edgeMm: 20, weightKg },
      { reps, onS: 10, edgeMm: 20, weightKg },
    ],
  });
  const record = {
    workoutId: "rep73",
    gripId: "half",
    edgeMm: 20,
    loadKg: 4,
    pct: 100,
    misses: 0,
    rpe: null,
    protocol,
    membershipId: null,
    week: null,
    focus: null,
    stravaActivityId: null,
    postState: null,
    postError: null,
    updatedAt: "t",
  };
  const standalone = { ...record, id: "h1", date: "2026-10-01", done: [open(5)] };
  const part = {
    ...record,
    id: "p1",
    date: "2026-10-05",
    workoutId: null,
    activityId: "a1",
    done: [open(8, 0)],
  };
  const m = model({ sessions: [standalone], parts: [part] });
  const runs = m.sessions.filter((s) => s.gripId === "open");

  it("counts in the grip's runs, newest first, a part's opening its activity", () => {
    expect(runs.map((r) => [r.date, r.loadKg, r.pct])).toEqual([
      ["2026-10-05", 8, 50],
      ["2026-10-01", 5, 100],
    ]);
    expect(gripSessionRows([...runs].reverse(), m.sessions, "kg").map((r) => r.id)).toEqual([
      "a1",
      "h1",
    ]);
  });

  it("gives the grip its last-used setup in the workout that ran it", () => {
    expect(m.setup(m.workout("rep73")!, "open")).toEqual({ edgeMm: 20, loadKg: 5 });
  });

  it("names a best only from a run that held every hang", () => {
    expect(gripMeta(m.sessions, "open", "2026-10-06", "kg").replace(/\s/g, " ")).toBe(
      "Best +5 kg · 20 mm"
    );
    const later = { ...record, id: "h2", gripId: "open", date: "2026-10-08", loadKg: 6, done: [] };
    expect(newBestOf(later, [...m.sessions, later], "Open hand", "kg")?.title).toBe(
      "Open hand +6 kg"
    );
    const lighter = { ...later, id: "h3", loadKg: 5 };
    expect(newBestOf(lighter, [...m.sessions, lighter], "Open hand", "kg")).toBeNull();
  });

  it("compares with the other grips on its setup", () => {
    expect(canCompareGrips(m.sessions)).toBe(true);
    expect(
      compareGrips(m.sessions, { edgeMm: 20, hangS: 10 }, (id) => id).map((r) => r.gripId)
    ).toEqual(["open", "half"]);
  });
});
