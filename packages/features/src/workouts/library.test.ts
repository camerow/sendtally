import { afterEach, describe, expect, it } from "vitest";
import type { WorkoutRecord } from "@sendtally/api-client";
import { WORKOUT_KINDS } from "@sendtally/core/hang";
import { setLocale } from "../i18n";
import { BUILT_IN_WORKOUT_IDS, builtInWorkouts } from "./builtIns";
import {
  bodySummary,
  browseLibrary,
  copyName,
  doseSummary,
  draftOf,
  libraryOf,
  libraryShelves,
  newWorkoutDraft,
  workoutMinutes,
  workoutUsage,
} from "./library";
import type { LibraryWorkout } from "./types";

afterEach(() => setLocale("en"));

const record = (
  over: Partial<WorkoutRecord> & Pick<WorkoutRecord, "id" | "name">
): WorkoutRecord => ({
  kind: "strength",
  description: "",
  minutes: null,
  targetRpe: null,
  variations: [{ label: "", items: [] }],
  pattern: [0],
  updatedAt: "2026-10-01T00:00:00Z",
  ...over,
});

const garage = record({
  id: "h-mine",
  kind: "hangboard",
  name: "Garage repeaters",
  variations: [
    {
      label: "",
      items: [{ exercise: "half", dose: { sets: 3, reps: 6, onS: 7, offS: 3, setRestS: 180 } }],
    },
  ],
});

const legs = record({
  id: "w-legs",
  name: "Leg day",
  description: "Heavy and slow",
  minutes: 50,
  targetRpe: 8,
  variations: [{ label: "", items: [{ exercise: "Goblet squat", dose: { sets: 3, reps: 8 } }] }],
});

const stretch = record({
  id: "w-stretch",
  kind: "mobility",
  name: "Evening stretch",
  variations: [{ label: "", items: [{ exercise: "Pancake", dose: { sets: 1, onS: 120 } }] }],
});

const library = (): LibraryWorkout[] => libraryOf([garage, legs, stretch]);

const ids = (workouts: readonly LibraryWorkout[]): string[] => workouts.map((w) => w.id);
const builtInIds = (workouts: readonly LibraryWorkout[]): string[] =>
  ids(workouts.filter((w) => w.source === "library"));

describe("libraryOf", () => {
  it("puts the built-ins and the user's own workouts of every kind in one list", () => {
    const all = library();
    expect(all.filter((w) => w.source === "mine").map((w) => w.id)).toEqual([
      "h-mine",
      "w-legs",
      "w-stretch",
    ]);
    expect(all.filter((w) => w.source === "library").map((w) => w.id)).toEqual(
      BUILT_IN_WORKOUT_IDS
    );
    expect(all.find((w) => w.id === "w-legs")).not.toHaveProperty("updatedAt");
  });

  it("offers a described built-in of every kind, named in the user's language", () => {
    const builtIns = builtInWorkouts();
    expect(new Set(builtIns.map((w) => w.kind))).toEqual(new Set(WORKOUT_KINDS));
    expect(builtIns.every((w) => w.description !== "")).toBe(true);
    setLocale("de");
    expect(builtInWorkouts().find((w) => w.id === "strength-5x5")?.name).toBe("5x5 Kraft");
  });

  it("shows alternation with built-ins that take turns by session", () => {
    const squat = builtInWorkouts().find((w) => w.id === "strength-squat");
    expect(squat?.variations.map((v) => [v.label, v.items[0]?.dose])).toEqual([
      ["5×5", { sets: 5, reps: 5 }],
      ["3×10", { sets: 3, reps: 10 }],
    ]);
    expect(squat?.pattern).toEqual([0, 1]);
    const fingers = builtInWorkouts().find((w) => w.id === "fingers-ab");
    expect(fingers?.variations.map((v) => v.label)).toEqual(["Max hangs", "Repeaters 7/3"]);
  });

  it("names a copy '(copy)', never '(mine)'", () => {
    expect(copyName("Repeaters 7:3")).toBe("Repeaters 7:3 (copy)");
  });

  it("drafts a workout for the editor, and a new one with one empty variation", () => {
    const { id: _, updatedAt: __, ...draft } = legs;
    expect(draftOf(library().find((w) => w.id === "w-legs")!)).toEqual(draft);
    expect(newWorkoutDraft("mobility")).toEqual({
      kind: "mobility",
      name: "",
      description: "",
      minutes: null,
      targetRpe: null,
      variations: [{ label: "", items: [] }],
      pattern: [0],
    });
  });
});

describe("workoutUsage", () => {
  it("counts uses by the workout a session names, or by its membership's", () => {
    const usage = workoutUsage(
      [
        { workoutId: "h-mine", date: "2026-10-01" },
        { workoutId: "h-mine", date: "2026-10-03" },
        { workoutId: "w-legs", date: "2026-10-05" },
        { workoutId: null, membershipId: "m1", date: "2026-10-06" },
        { workoutId: null, membershipId: "gone", date: "2026-10-07" },
        { date: "2026-09-01" },
      ],
      [{ id: "m1", workoutId: "w-stretch" }]
    );
    expect(usage.get("h-mine")).toEqual({ count: 2, last: "2026-10-03" });
    expect(usage.get("w-legs")).toEqual({ count: 1, last: "2026-10-05" });
    expect(usage.get("w-stretch")).toEqual({ count: 1, last: "2026-10-06" });
    expect(usage.size).toBe(3);
  });
});

describe("browseLibrary", () => {
  const usage = workoutUsage(
    [
      { workoutId: "h-mine", date: "2026-10-03" },
      { workoutId: "w-stretch", date: "2026-10-06" },
    ],
    []
  );

  it("puts the user's own first by last use, then name, and the built-ins after", () => {
    expect(ids(browseLibrary(library(), { text: "" }, usage))).toEqual([
      "w-stretch",
      "h-mine",
      "w-legs",
      ...BUILT_IN_WORKOUT_IDS,
    ]);
  });

  it("searches names, descriptions, kinds, labels and exercises, ignoring case and accents", () => {
    const search = (text: string): string[] => ids(browseLibrary(library(), { text }, usage));
    expect(search("garage")).toEqual(["h-mine"]);
    expect(search("HEAVY leg")).toEqual(["w-legs"]);
    expect(search("goblet")).toEqual(["w-legs"]);
    expect(search("pancake")).toEqual(["w-stretch"]);
    expect(search("half crimp")[0]).toBe("h-mine");
    expect(search("3×10")).toEqual(["strength-squat"]);
    expect(search("nothing like this")).toEqual([]);
    setLocale("fr");
    expect(builtInIds(browseLibrary(libraryOf([]), { text: "developpe" }, usage))).toContain(
      "strength-5x5"
    );
  });

  it("narrows to some kinds", () => {
    const found = browseLibrary(library(), { text: "", kinds: ["hangboard"] }, usage);
    expect(found[0]?.id).toBe("h-mine");
    expect(found.every((w) => w.kind === "hangboard")).toBe(true);
  });
});

describe("libraryShelves", () => {
  it("makes one shelf per category in order, the user's own mixed in first", () => {
    const usage = workoutUsage([{ workoutId: "w-legs", date: "2026-10-06" }], []);
    const shelves = libraryShelves(library(), usage);
    expect(shelves.map((s) => s.kind)).toEqual(WORKOUT_KINDS);
    const strength = shelves.find((s) => s.kind === "strength")?.workouts ?? [];
    expect(strength[0]?.id).toBe("w-legs");
    expect(builtInIds(strength)).toEqual(
      builtInWorkouts()
        .filter((w) => w.kind === "strength")
        .map((w) => w.id)
    );
    expect(shelves.every((s) => s.workouts.every((w) => w.kind === s.kind))).toBe(true);
  });

  it("leaves out a category with nothing in it", () => {
    const mine = library().filter((w) => w.source === "mine");
    expect(libraryShelves(mine, new Map()).map((s) => s.kind)).toEqual([
      "hangboard",
      "strength",
      "mobility",
    ]);
  });
});

describe("summaries", () => {
  const byId = (id: string): LibraryWorkout => library().find((w) => w.id === id)!;

  it("sums up a workout in a few words", () => {
    expect(bodySummary(byId("strength-5x5"))).toBe("3 exercises");
    expect(bodySummary(byId("w-stretch"))).toBe("1 exercise");
    expect(bodySummary(byId("h-mine"))).toBe("6 × 7s on / 3s off · 3 sets · 3:00 rest");
    expect(bodySummary(byId("climb-limit"))).toBeNull();
  });

  it("describes a dose for each kind", () => {
    expect(doseSummary("strength", { sets: 5, reps: 5, weightKg: 100 }, "kg")).toBe(
      "5 × 5 · 100 kg"
    );
    expect(doseSummary("mobility", { sets: 3, onS: 45 }, "kg")).toBe("3 × 45s");
    expect(doseSummary("other", { sets: 2 }, "kg")).toBe("2 sets");
    expect(
      doseSummary(
        "hangboard",
        { sets: 3, reps: 6, onS: 7, offS: 3, setRestS: 180, edgeMm: 20, weightKg: 5 },
        "kg"
      )
    ).toBe("6 × 7s on / 3s off · 3 sets · 3:00 rest · 20 mm · 5 kg");
  });

  it("takes a timed workout's length from its first variation when it has no minutes", () => {
    expect(workoutMinutes(byId("run-tempo"))).toBe(25);
    expect(workoutMinutes({ ...byId("run-tempo"), minutes: null })).toBe(25);
    expect(workoutMinutes(byId("rep73"))).toBe(21);
    expect(workoutMinutes(byId("w-legs"))).toBe(50);
    expect(workoutMinutes({ ...byId("w-legs"), minutes: null })).toBeNull();
  });
});
