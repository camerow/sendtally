import { describe, expect, it } from "vitest";
import { summarise, type HangSession, type Protocol } from "@sendtally/core/hang";
import {
  bestIndex,
  canCompareGrips,
  compareGrips,
  gripSessionRows,
  gripTiles,
  milestoneRows,
  newBestOf,
} from "./progress";

const max10: Protocol = {
  name: "Max hangs",
  kind: "hang",
  hangS: 10,
  restS: 0,
  reps: 1,
  sets: 6,
  setRestS: 180,
};
const pulls: Protocol = { ...max10, kind: "pull", hangS: 0, reps: 5, sets: 5 };

const hang = (date: string, loadKg: number, over: Partial<HangSession> = {}): HangSession => ({
  id: `${over.gripId ?? "half"}-${date}`,
  workoutId: "max",
  gripId: "half",
  date,
  edgeMm: 20,
  loadKg,
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

const names: Record<string, string> = { half: "Half crimp", open: "Open hand", pinch: "Pinch" };
const gripName = (id: string): string => names[id] ?? id;

const series = [
  hang("2026-09-01", 2),
  hang("2026-09-08", 6),
  hang("2026-09-15", 9, { pct: 75 }),
  hang("2026-09-22", 6, { rpe: 8 }),
];

describe("grip screen", () => {
  it("tiles the best with the day it came, the top attempt and the average effort", () => {
    const summary = summarise(series, "2026-09-29")!;
    expect(bestIndex(series, summary)).toBe(1);
    expect(gripTiles(series, summary, "kg")).toEqual([
      { value: "+6 kg", label: "Best · Sep 8" },
      { value: "+9 kg", label: "Top attempt · 75%" },
      { value: "7.3/10", label: "Avg effort" },
    ]);
  });

  it("has no best tile until a session is complete", () => {
    const partials = [hang("2026-09-01", 0, { pct: 50 }), hang("2026-09-08", 2, { pct: 80 })];
    const summary = summarise(partials, "2026-09-29")!;
    expect(bestIndex(partials, summary)).toBe(-1);
    expect(gripTiles(partials, summary, "kg")[0]).toEqual({ value: "–", label: "Best" });
  });

  it("lists sessions newest first, marking each that beat the best before it", () => {
    const rows = gripSessionRows(series, series, "kg");
    expect(rows.map((r) => [r.load, r.completion, r.best])).toEqual([
      ["+6 kg", "100%", false],
      ["+9 kg", "75%", false],
      ["+6 kg", "100%", true],
      ["+2 kg", "100%", false],
    ]);
    expect(rows[0]?.meta).toBe("Sep 22 · 20\u00A0mm · 10s × 6");
  });

  it("says each milestone newest first, naming the setup only when they are mixed", () => {
    const rows = milestoneRows(series, "kg", false);
    expect(rows.map((r) => r.text)).toEqual(["Reached +5 kg", "First session on this grip"]);
    expect(rows[0]?.meta).toBe("Sep 8");
    expect(milestoneRows(series, "kg", true)[0]?.meta).toBe("Sep 8 · 20\u00A0mm · 10s");
  });
});

describe("compareGrips", () => {
  const all = [
    ...series,
    hang("2026-09-02", 10, { gripId: "open" }),
    hang("2026-09-09", 12, { gripId: "open" }),
    hang("2026-09-03", -5, { gripId: "pinch", edgeMm: 15 }),
    hang("2026-09-04", 40, { gripId: "pinch", edgeMm: 0, protocol: pulls }),
  ];

  it("ranks grips on one setup by best completed load, leaving out grips not on it", () => {
    expect(compareGrips(all, { edgeMm: 20, hangS: 10 }, gripName)).toEqual([
      { gripId: "open", name: "Open hand", bestKg: 12, changeKg: 2 },
      { gripId: "half", name: "Half crimp", bestKg: 6, changeKg: 4 },
    ]);
  });

  it("is worth comparing only once two grips are complete on one setup", () => {
    expect(canCompareGrips(all)).toBe(true);
    expect(canCompareGrips(series)).toBe(false);
    expect(canCompareGrips([...series, hang("2026-09-02", 10, { gripId: "open", pct: 90 })])).toBe(
      false
    );
    expect(
      canCompareGrips([...series, hang("2026-09-02", 10, { gripId: "open", edgeMm: 15 })])
    ).toBe(false);
  });

  it("compares ground pulls only with each other", () => {
    expect(compareGrips(all, { edgeMm: 0, hangS: 0 }, gripName).map((r) => r.gripId)).toEqual([
      "pinch",
    ]);
  });
});

describe("newBestOf", () => {
  it("names the grip and load, its setup and how far it beat the last best", () => {
    const now = hang("2026-09-29", 8);
    expect(newBestOf(now, [...series, now], "Half crimp", "kg")).toEqual({
      title: "Half crimp +8 kg",
      meta: "20\u00A0mm · 10s · up 2 kg on your last best",
    });
  });

  it("is null for a first session or one that did not beat the best", () => {
    expect(newBestOf(series[0]!, series, "Half crimp", "kg")).toBeNull();
    expect(newBestOf(series[3]!, series, "Half crimp", "kg")).toBeNull();
  });
});
