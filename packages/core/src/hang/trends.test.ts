import { describe, expect, it } from "vitest";
import {
  gripSeries,
  milestones,
  newBestBy,
  previousBest,
  setupOf,
  setupsOf,
  type HangSession,
  type Protocol,
} from ".";

const max10: Protocol = {
  name: "Max hangs",
  kind: "hang",
  hangS: 10,
  restS: 0,
  reps: 1,
  sets: 6,
  setRestS: 180,
};
const pulls: Protocol = { ...max10, name: "Block pulls", kind: "pull", hangS: 0, reps: 5 };

let n = 0;
const hang = (over: Partial<HangSession>): HangSession => ({
  id: `s${++n}`,
  workoutId: "max",
  gripId: "half",
  date: "2026-09-01",
  edgeMm: 20,
  loadKg: 0,
  pct: 100,
  misses: 0,
  rpe: 7,
  protocol: max10,
  membershipId: null,
  week: null,
  focus: null,
  done: [],
  ...over,
});

describe("grip setups", () => {
  it("reads a setup as edge and hang time, and every ground pull as one", () => {
    expect(setupOf(hang({}))).toEqual({ edgeMm: 20, hangS: 10 });
    expect(setupOf(hang({ protocol: { ...max10, hangS: 7 } }))).toEqual({ edgeMm: 20, hangS: 7 });
    expect(setupOf(hang({ edgeMm: 0, protocol: pulls }))).toEqual({ edgeMm: 0, hangS: 0 });
  });

  it("lists a grip's setups most used first, then most recent", () => {
    const sessions = [
      hang({ date: "2026-09-01", edgeMm: 15 }),
      hang({ date: "2026-09-02", edgeMm: 20 }),
      hang({ date: "2026-09-03", edgeMm: 20 }),
      hang({ date: "2026-09-04", edgeMm: 10 }),
      hang({ date: "2026-09-05", gripId: "open", edgeMm: 25 }),
    ];
    expect(setupsOf(sessions, "half").map((s) => s.edgeMm)).toEqual([20, 10, 15]);
    expect(setupsOf(sessions)).toHaveLength(4);
  });

  it("follows one grip on one setup across workouts, oldest first", () => {
    const sessions = [
      hang({ date: "2026-09-03", workoutId: "repeaters" }),
      hang({ date: "2026-09-01" }),
      hang({ date: "2026-09-02", edgeMm: 15 }),
      hang({ date: "2026-09-04", gripId: "open" }),
    ];
    const series = gripSeries(sessions, "half", { edgeMm: 20, hangS: 10 });
    expect(series.map((s) => s.date)).toEqual(["2026-09-01", "2026-09-03"]);
    expect(gripSeries(sessions, "half")).toHaveLength(3);
  });
});

describe("bests", () => {
  const before = [
    hang({ date: "2026-09-01", loadKg: 8 }),
    hang({ date: "2026-09-02", loadKg: 14, pct: 80 }),
    hang({ date: "2026-09-03", loadKg: 30, edgeMm: 25 }),
  ];

  it("takes the previous best from completed sessions on the same setup", () => {
    const now = hang({ date: "2026-09-10", loadKg: 10 });
    expect(previousBest([...before, now], now)).toBe(8);
    expect(newBestBy([...before, now], now)).toBe(2);
  });

  it("is no new best without one before, when partial, or when not heavier", () => {
    const first = hang({ date: "2026-09-10", edgeMm: 10, loadKg: 5 });
    expect(newBestBy([...before, first], first)).toBeNull();
    const partial = hang({ date: "2026-09-10", loadKg: 12, pct: 90 });
    expect(newBestBy([...before, partial], partial)).toBeNull();
    const same = hang({ date: "2026-09-10", loadKg: 8 });
    expect(newBestBy([...before, same], same)).toBeNull();
  });
});

describe("milestones", () => {
  it("marks the first session, round numbers per setup and smaller edges at bodyweight", () => {
    const series = [
      hang({ date: "2026-09-01", edgeMm: 20, loadKg: 3 }),
      hang({ date: "2026-09-02", edgeMm: 20, loadKg: 6 }),
      hang({ date: "2026-09-03", edgeMm: 20, loadKg: 7 }),
      hang({ date: "2026-09-04", edgeMm: 20, loadKg: 12, pct: 60 }),
      hang({ date: "2026-09-05", edgeMm: 20, loadKg: 16 }),
      hang({ date: "2026-09-06", edgeMm: 15, loadKg: -5 }),
      hang({ date: "2026-09-07", edgeMm: 15, loadKg: 0 }),
      hang({ date: "2026-09-08", edgeMm: 15, loadKg: 1 }),
    ];
    expect(
      milestones(series).map((m) => [m.kind, m.kind === "over" ? m.kg : null, m.session.date])
    ).toEqual([
      ["first", null, "2026-09-01"],
      ["over", 5, "2026-09-02"],
      ["over", 15, "2026-09-05"],
      ["over", 0, "2026-09-07"],
      ["edge", null, "2026-09-07"],
    ]);
  });

  it("counts ground pulls in tens", () => {
    const series = [25, 32, 38, 41].map((loadKg, i) =>
      hang({ date: `2026-09-0${i + 1}`, edgeMm: 0, protocol: pulls, loadKg })
    );
    expect(milestones(series).flatMap((m) => (m.kind === "over" ? [m.kg] : []))).toEqual([30, 40]);
  });

  it("has none without sessions", () => {
    expect(milestones([])).toEqual([]);
  });
});
