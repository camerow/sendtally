import { afterEach, describe, expect, it } from "vitest";
import type { HangData } from "@sendtally/api-client";
import { LIBRARY } from "@sendtally/core/hang";
import { setLocale } from "../i18n";
import { hangModel, renameClash } from "./model";

afterEach(() => setLocale("en"));

const data = (overrides: Partial<HangData> = {}): HangData => ({
  grips: [
    { id: "g1", name: "Mono", custom: true, hidden: true },
    { id: "g2", name: "Mono 2", custom: true, hidden: false },
  ],
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

describe("renameClash", () => {
  it("lets a rename take a deleted grip's name", () => {
    expect(renameClash(hangModel(data()).grips, "g2", "mono")).toBeUndefined();
  });

  it("blocks a visible grip's name, but not the grip's own", () => {
    const { grips } = hangModel(data());
    expect(renameClash(grips, "g1", "MONO 2")?.id).toBe("g2");
    expect(renameClash(grips, "g2", "mono 2")).toBeUndefined();
  });

  it("blocks a built-in under its shown name and its English one", () => {
    setLocale("de");
    const { grips } = hangModel(data());
    expect(renameClash(grips, "g2", "offene hand")?.id).toBe("open");
    expect(renameClash(grips, "g2", "Open hand")).toMatchObject({
      id: "open",
      name: "Offene Hand",
    });
  });
});

describe("defaultGrip", () => {
  it("skips a deleted grip a workout was created with", () => {
    const workout = { ...LIBRARY[0]!, id: "w1", source: "mine" as const, grip: "g1" };
    const model = hangModel(data({ workouts: [workout] }));
    expect(model.defaultGrip(workout)).toBe("half");
    expect(model.defaultGrip({ ...workout, grip: "g2" })).toBe("g2");
  });
});

describe("setup", () => {
  const rep73 = LIBRARY[0]!;
  const mine = { ...rep73, id: "w1", source: "mine" as const, edgeMm: 18 };
  const schedule = {
    id: "s1",
    workoutId: "rep73",
    gripId: "half",
    days: [0 as const],
    start: "2026-10-05",
    end: null,
    skip: [],
    edgeMm: 15,
    loadKg: null,
  };
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
    protocol: rep73,
    stravaActivityId: null,
    postState: null,
    postError: null,
    updatedAt: "t",
  };

  it("plans from the schedule landing on the day, filling gaps from the last session", () => {
    const model = hangModel(data({ schedules: [schedule], sessions: [session] }));
    expect(model.setup(rep73, "half", { date: "2026-10-05" })).toEqual({ edgeMm: 15, loadKg: 6 });
    expect(model.setup(rep73, "half", { date: "2026-10-06" })).toEqual({ edgeMm: 20, loadKg: 6 });
    expect(model.setup(rep73, "half", { schedule })).toEqual({ edgeMm: 15, loadKg: 6 });
  });

  it("falls back to what the workout held before setups, then the default", () => {
    const model = hangModel(data({ workouts: [mine], loads: { "w1:open": -4 } }));
    expect(model.setup(mine, "open")).toEqual({ edgeMm: 18, loadKg: -4 });
    expect(model.setup(rep73, "open")).toEqual({ edgeMm: 20, loadKg: 0 });
    expect(model.lastUsed(rep73, "open")).toBeNull();
    expect(model.lastUsed(mine, "open")).toEqual({ edgeMm: 18, loadKg: -4 });
    expect(model.lastUsed(mine, "half")).toBeNull();
  });
});
