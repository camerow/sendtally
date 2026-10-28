import { describe, expect, it } from "vitest";
import { clampEdge, edgesOf, lastSession, resolveSetup, type HangSession } from ".";

const session = (over: Partial<HangSession>): HangSession => ({
  id: over.date ?? "s",
  workoutId: "rep73",
  gripId: "half",
  date: "2026-09-01",
  edgeMm: 20,
  loadKg: 0,
  pct: 100,
  misses: 0,
  rpe: null,
  protocol: { name: "R", kind: "hang", hangS: 7, restS: 3, reps: 6, sets: 6, setRestS: 180 },
  membershipId: null,
  week: null,
  done: [],
  ...over,
});

describe("setup", () => {
  it("takes each field from the first layer that sets it", () => {
    expect(
      resolveSetup("hang", [
        { edgeMm: 15, loadKg: null },
        { edgeMm: 20, loadKg: -5 },
      ])
    ).toEqual({ edgeMm: 15, loadKg: -5 });
    expect(resolveSetup("hang", [{ loadKg: 0 }, { loadKg: 4 }])).toEqual({ edgeMm: 20, loadKg: 0 });
  });

  it("falls back to the kind's default", () => {
    expect(resolveSetup("hang", [null, undefined, {}])).toEqual({ edgeMm: 20, loadKg: 0 });
    expect(resolveSetup("pull", [])).toEqual({ edgeMm: 0, loadKg: 20 });
  });

  it("finds the latest session of a workout on a grip", () => {
    const sessions = [
      session({ date: "2026-09-03", edgeMm: 18 }),
      session({ date: "2026-09-05", gripId: "open" }),
      session({ date: "2026-09-04", edgeMm: 15 }),
    ];
    expect(lastSession(sessions, "rep73", "half")?.edgeMm).toBe(15);
    expect(lastSession(sessions, "max10", "half")).toBeUndefined();
  });

  it("keeps an edge within the board's range", () => {
    expect([clampEdge(2), clampEdge(14.6), clampEdge(80)]).toEqual([4, 15, 60]);
  });

  it("lists a series' edges once each, shallowest first", () => {
    expect(edgesOf([{ edgeMm: 20 }, { edgeMm: 15 }, { edgeMm: 20 }])).toEqual([15, 20]);
  });
});
