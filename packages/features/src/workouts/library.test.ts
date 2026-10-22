import { afterEach, describe, expect, it } from "vitest";
import type { HangData, UserWorkout } from "@sendtally/api-client";
import { LIBRARY, NEW_WORKOUT } from "@sendtally/core/hang";
import { hangModel } from "../hang";
import { setLocale } from "../i18n";
import { BUILT_IN_WORKOUT_IDS, builtInWorkouts } from "./builtIns";
import {
  bodySummary,
  browseLibrary,
  copyName,
  DEFAULT_FILTER,
  draftOf,
  libraryOf,
  parseTags,
  planTemplateOf,
  workoutMinutes,
  workoutUsage,
} from "./library";
import type { LibraryFilter, LibraryWorkout } from "./types";

afterEach(() => setLocale("en"));

const hangData = (overrides: Partial<HangData> = {}): HangData => ({
  grips: [],
  workouts: [],
  defaultGrips: {},
  loads: {},
  schedules: [],
  sessions: [],
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

const myHang = { ...NEW_WORKOUT, id: "h-mine", name: "Garage repeaters", source: "mine" as const };

const legs: UserWorkout = {
  id: "w-legs",
  name: "Leg day",
  category: "strength",
  description: "Heavy and slow",
  tags: ["gym"],
  minutes: 50,
  targetRpe: 8,
  body: {
    kind: "sets",
    exercises: [{ name: "Goblet squat", measures: ["reps"], sets: [{ reps: 8 }] }],
  },
  updatedAt: "2026-10-01T00:00:00Z",
};

const stretch: UserWorkout = {
  ...legs,
  id: "w-stretch",
  name: "Evening stretch",
  category: "mobility",
  description: null,
  tags: [],
  minutes: null,
  targetRpe: null,
  body: { kind: "checklist", items: [{ text: "Pancake", dose: "2 min" }] },
};

const library = (): LibraryWorkout[] =>
  libraryOf(hangModel(hangData({ workouts: [myHang] })).workouts, [legs, stretch]);

const filter = (over: Partial<LibraryFilter>): LibraryFilter => ({ ...DEFAULT_FILTER, ...over });

const ids = (list: readonly LibraryWorkout[]): string[] => list.map((w) => w.id);

describe("libraryOf", () => {
  it("shows every hangboard workout the user already has beside the built-ins and their others", () => {
    const all = library();
    const mine = all.filter((w) => w.source === "mine");
    expect(ids(mine)).toEqual(["h-mine", "w-legs", "w-stretch"]);
    expect(all.find((w) => w.id === "h-mine")).toMatchObject({
      category: "hang",
      name: "Garage repeaters",
      body: { kind: "hang", workout: myHang },
    });
    for (const w of LIBRARY) expect(all.find((x) => x.id === w.id)?.source).toBe("library");
    expect(ids(all.filter((w) => BUILT_IN_WORKOUT_IDS.includes(w.id)))).toEqual(
      BUILT_IN_WORKOUT_IDS
    );
  });

  it("offers a built-in workout in every category but hangboard, named in the user's language", () => {
    const categories = new Set(builtInWorkouts().map((w) => w.category));
    expect([...categories].sort()).toEqual([
      "climb",
      "mobility",
      "other",
      "run",
      "strength",
      "yoga",
    ]);
    setLocale("de");
    expect(builtInWorkouts().find((w) => w.id === "strength-5x5")?.name).toBe("5x5 Kraft");
  });

  it("names a copy '(copy)', never '(mine)'", () => {
    expect(copyName("Repeaters 7:3")).toBe("Repeaters 7:3 (copy)");
  });

  it("drafts any workout but a hangboard one for the editor", () => {
    const all = library();
    expect(draftOf(all.find((w) => w.id === "h-mine")!)).toBeNull();
    expect(draftOf(all.find((w) => w.id === "w-legs")!)).toEqual({
      name: "Leg day",
      category: "strength",
      description: "Heavy and slow",
      tags: ["gym"],
      minutes: 50,
      targetRpe: 8,
      body: legs.body,
    });
  });
});

describe("browseLibrary", () => {
  const usage = workoutUsage(
    [
      { workoutId: "h-mine", date: "2026-10-01" },
      { workoutId: "h-mine", date: "2026-10-03" },
    ],
    [
      { workoutId: "w-legs", date: "2026-10-05", planItemId: null },
      { workoutId: null, date: "2026-10-06", planItemId: "p1" },
      { date: "2026-09-01" },
    ],
    [{ id: "p1", workoutId: "w-stretch" }]
  );

  it("counts uses by workout, or by the plan an activity fulfilled", () => {
    expect(usage.get("h-mine")).toEqual({ count: 2, last: "2026-10-03" });
    expect(usage.get("w-legs")).toEqual({ count: 1, last: "2026-10-05" });
    expect(usage.get("w-stretch")).toEqual({ count: 1, last: "2026-10-06" });
  });

  it("searches names, descriptions, tags, categories and what the body holds, ignoring case and accents", () => {
    const all = library();
    expect(ids(browseLibrary(all, filter({ text: "garage" }), usage))).toEqual(["h-mine"]);
    expect(ids(browseLibrary(all, filter({ text: "GYM leg" }), usage))).toEqual(["w-legs"]);
    expect(ids(browseLibrary(all, filter({ text: "goblet" }), usage))).toEqual(["w-legs"]);
    expect(ids(browseLibrary(all, filter({ text: "pancake" }), usage))).toEqual(["w-stretch"]);
    expect(ids(browseLibrary(all, filter({ text: "yoga" }), usage))).toEqual(["yoga-climbers"]);
    expect(browseLibrary(all, filter({ text: "nothing like this" }), usage)).toEqual([]);
    setLocale("fr");
    const fr = libraryOf([], []);
    expect(ids(browseLibrary(fr, filter({ text: "developpe" }), usage))).toContain("strength-5x5");
  });

  it("filters by any mix of categories and by source", () => {
    const all = library();
    const picked = browseLibrary(all, filter({ categories: ["hang", "mobility"] }), usage);
    expect(new Set(picked.map((w) => w.category))).toEqual(new Set(["hang", "mobility"]));
    const mine = browseLibrary(all, filter({ source: "mine", sort: "name" }), usage);
    expect(ids(mine)).toEqual(["w-stretch", "h-mine", "w-legs"]);
    const builtIn = browseLibrary(all, filter({ source: "library" }), usage);
    expect(builtIn.every((w) => w.source === "library")).toBe(true);
  });

  it("sorts by last use, by uses, by name or by duration, ties by name", () => {
    const all = library().filter((w) => w.source === "mine");
    expect(ids(browseLibrary(all, filter({ sort: "recent" }), usage))).toEqual([
      "w-stretch",
      "w-legs",
      "h-mine",
    ]);
    expect(ids(browseLibrary(all, filter({ sort: "most" }), usage))).toEqual([
      "h-mine",
      "w-stretch",
      "w-legs",
    ]);
    expect(ids(browseLibrary(all, filter({ sort: "duration" }), usage))).toEqual([
      "h-mine",
      "w-legs",
      "w-stretch",
    ]);
  });
});

describe("summaries", () => {
  it("sums up each body in a few words", () => {
    const all = libraryOf([], [legs, stretch]);
    const byId = (id: string): LibraryWorkout => all.find((w) => w.id === id)!;
    expect(bodySummary(byId("strength-5x5"))).toBe("3 exercises");
    expect(bodySummary(byId("mobility-hips"))).toBe("6 items");
    expect(bodySummary(byId("w-stretch"))).toBe("1 item");
    expect(bodySummary(byId("run-tempo"))).toBe("5 rounds · 2 steps · 25 min");
    expect(bodySummary(byId("climb-limit"))).toBe("Limit");
    expect(bodySummary({ ...byId("w-legs"), body: null })).toBeNull();
  });

  it("takes an intervals workout's length from its steps when it has no minutes", () => {
    const tempo = libraryOf([], []).find((w) => w.id === "run-tempo")!;
    expect(workoutMinutes({ ...tempo, minutes: null })).toBe(25);
    expect(workoutMinutes({ ...tempo, body: null, minutes: null })).toBeNull();
  });
});

describe("planTemplateOf", () => {
  const own = { kind: "checklist" as const, items: [{ text: "Own", dose: "" }] };

  it("runs the workout's body while it exists, else the plan's own template", () => {
    const all = libraryOf([], [legs]);
    expect(planTemplateOf({ template: own, workoutId: "w-legs" }, all)).toEqual(legs.body);
    expect(planTemplateOf({ template: own, workoutId: "gone" }, all)).toEqual(own);
    expect(planTemplateOf({ template: own, workoutId: null }, all)).toEqual(own);
    expect(planTemplateOf({ template: null, workoutId: "climb-limit" }, all)).toBeNull();
  });
});

describe("parseTags", () => {
  it("trims, drops empties and repeats, and keeps ten", () => {
    expect(parseTags(" legs, gym,,legs ,")).toEqual(["legs", "gym"]);
    expect(parseTags(Array.from({ length: 12 }, (_, i) => `t${i}`).join(","))).toHaveLength(10);
  });
});
