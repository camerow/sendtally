import { describe, expect, it } from "vitest";
import { defaultBlockName, defaultWorkoutName, nameOr } from "./defaultNames";

describe("names that never block", () => {
  it("names a workout for its first exercise's kind, strength before it has one", () => {
    expect(defaultWorkoutName(undefined)).toBe("Strength workout");
    expect(defaultWorkoutName("strength")).toBe("Strength workout");
    expect(defaultWorkoutName("hangboard")).toBe("Hangboard workout");
    expect(defaultWorkoutName("climbing")).toBe("Climbing workout");
    expect(defaultWorkoutName("mobility")).toBe("Mobility workout");
  });

  it("follows the kind until a name is typed, keeps what was typed, and falls back when it is emptied", () => {
    expect(nameOr(null, defaultWorkoutName("hangboard"))).toBe("Hangboard workout");
    expect(nameOr("Pull day", defaultWorkoutName("hangboard"))).toBe("Pull day");
    expect(nameOr("  Pull day ", defaultWorkoutName("climbing"))).toBe("Pull day");
    expect(nameOr("   ", defaultWorkoutName("climbing"))).toBe("Climbing workout");
  });

  it("names a block for the month it starts in", () => {
    expect(defaultBlockName("2026-11-23")).toBe("November block");
    expect(defaultBlockName("2027-01-04")).toBe("January block");
    expect(nameOr("", defaultBlockName("2026-11-23"))).toBe("November block");
  });
});
