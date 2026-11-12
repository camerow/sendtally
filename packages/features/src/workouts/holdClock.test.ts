import { describe, expect, it } from "vitest";
import { heldSeconds, holdEndsAt, holdNow, pauseHold, resumeHold, startHold } from "./holdClock";

const s = (n: number): number => n * 1000;

describe("a hold", () => {
  const plank = startHold("0:0", "Plank", 30, false, 0);

  it("counts in for three seconds, then counts up to its target", () => {
    expect(holdNow(plank, 0)).toEqual({ phase: "countIn", left: 3 });
    expect(holdNow(plank, s(2.5))).toEqual({ phase: "countIn", left: 1 });
    expect(holdNow(plank, s(13.5))).toMatchObject({ phase: "hold", side: null, seconds: 10 });
    expect(holdNow(plank, holdEndsAt(plank))).toEqual({ phase: "over" });
    expect(heldSeconds(plank, s(1))).toBeNull();
    expect(heldSeconds(plank, s(15))).toBe(12);
    expect(heldSeconds(plank, s(99))).toBe(30);
  });

  it("stands still while paused and picks up where it was", () => {
    const paused = pauseHold(plank, s(10));
    expect(holdNow(paused, s(60))).toMatchObject({ seconds: 7 });
    expect(holdNow(resumeHold(paused, s(60)), s(61))).toMatchObject({ seconds: 8 });
  });

  it("runs each side in turn with a switch between, and records the shorter", () => {
    const pigeon = startHold("2", "Pigeon", 60, true, 0);
    expect(holdNow(pigeon, s(23))).toMatchObject({ side: "L", seconds: 20 });
    expect(holdNow(pigeon, s(64))).toEqual({ phase: "switch", left: 4 });
    expect(holdNow(pigeon, s(89))).toMatchObject({ side: "R", seconds: 21 });
    expect(heldSeconds(pigeon, s(89))).toBe(21);
    expect(holdEndsAt(pigeon)).toBe(s(128));
  });
});
