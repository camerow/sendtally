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
