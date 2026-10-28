import { describe, expect, it } from "vitest";
import {
  addDays,
  addMonths,
  bumpLoad,
  cameOffEarly,
  endRun,
  logLift,
  parseNumber,
  parseSeconds,
  phasesFor,
  resultOf,
  skip,
  startRun,
  summarise,
  tick,
  togglePause,
  toUnit,
  fromUnit,
  isCalendarDate,
  totalSeconds,
  weekday,
  type HangSession,
  type Protocol,
} from ".";

const repeaters: Protocol = {
  name: "Repeaters 7:3",
  kind: "hang",
  hangS: 7,
  restS: 3,
  reps: 6,
  sets: 6,
  setRestS: 180,
};
const blockPulls: Protocol = {
  name: "Block pulls",
  kind: "pull",
  hangS: 0,
  restS: 0,
  reps: 5,
  sets: 5,
  setRestS: 120,
};

const session = (over: Partial<HangSession>): HangSession => ({
  id: over.date ?? "s",
  workoutId: "rep73",
  gripId: "half",
  date: "2026-09-01",
  edgeMm: 20,
  loadKg: 0,
  pct: 100,
  misses: 0,
  rpe: 7,
  protocol: repeaters,
  membershipId: null,
  week: null,
  focus: null,
  done: [],
  ...over,
});

describe("calendar", () => {
  it("steps across a daylight-saving change without drifting", () => {
    expect(addDays("2026-10-24", 2)).toBe("2026-10-26");
    expect(addDays("2026-03-28", 2)).toBe("2026-03-30");
    expect(weekday("2026-10-26")).toBe(0);
  });

  it("steps months across a year", () => {
    expect(addMonths("2026-12-15", 1)).toBe("2027-01-01");
    expect(addMonths("2026-01-31", -1)).toBe("2025-12-01");
  });
});

describe("protocol", () => {
  it("omits the rest after the last hang and zero-length rests", () => {
    const kinds = phasesFor({ ...repeaters, reps: 2, sets: 2 }).map((p) => p.kind);
    expect(kinds).toEqual(["ready", "hang", "rest", "hang", "setrest", "hang", "rest", "hang"]);
    expect(phasesFor({ ...repeaters, reps: 2, sets: 1, restS: 0 }).map((p) => p.kind)).toEqual([
      "ready",
      "hang",
      "hang",
    ]);
  });

  it("counts six seconds per lift and excludes Get ready", () => {
    expect(totalSeconds(blockPulls)).toBe(5 * 5 * 6 + 4 * 120);
    expect(totalSeconds(repeaters)).toBe(6 * (6 * 7 + 5 * 3) + 5 * 180);
  });
});

describe("loads", () => {
  it("rounds display to the nearest half unit and steps in the display unit", () => {
    expect(toUnit(4, "lb")).toBe(9);
    expect(toUnit(fromUnit(toUnit(4, "lb"), "lb"), "kg")).toBe(4);
    expect(bumpLoad("hang", 0, "kg", -1)).toBe(-1);
    expect(bumpLoad("pull", 0, "kg", -1)).toBe(0);
    expect(toUnit(bumpLoad("pull", 20, "lb", 1), "lb")).toBe(49);
  });
});

describe("parsing", () => {
  it.each([
    ["1:30", "min", 90],
    ["90", "s", 90],
    ["3", "min", 180],
    ["abc", "s", null],
  ] as const)("reads %s in %s mode", (text, unit, seconds) => {
    expect(parseSeconds(text, unit)).toBe(seconds);
  });

  it("accepts a comma decimal and the minus sign", () => {
    expect(parseNumber("−3")).toBe(-3);
    expect(parseNumber("2,5")).toBe(2.5);
    expect(parseNumber("")).toBeNull();
  });
});

describe("timer", () => {
  const short: Protocol = { ...repeaters, reps: 2, sets: 2, hangS: 7, restS: 3, setRestS: 10 };

  it("catches up every phase that ran out while the app was away", () => {
    const run = tick(startRun(short, 0), (5 + 7 + 3 + 7 + 10 + 1) * 1000);
    expect(run.phases[run.index]?.kind).toBe("hang");
    expect(run.phases[run.index]?.set).toBe(2);
    expect(run.work).toBe(14);
    expect(run.marks).toEqual([]);
  });

  it("credits the seconds held when coming off early, and nothing for a skip", () => {
    let run = tick(startRun(short, 0), 5000);
    run = cameOffEarly(run, 5000 + 4600);
    expect(run.work).toBe(4);
    expect(run.misses).toBe(1);
    run = tick(run, 5000 + 4600 + 3000);
    run = skip(run, 13000);
    expect(run.misses).toBe(2);
    expect(run.work).toBe(4);
  });

  it("does not advance while paused and shifts the clock on resume", () => {
    let run = tick(startRun(short, 0), 5000);
    run = togglePause(run, 6000);
    run = tick(run, 60_000);
    expect(run.phases[run.index]?.kind).toBe("hang");
    run = togglePause(run, 60_000);
    expect(tick(run, 60_000 + 5999).index).toBe(1);
    expect(tick(run, 60_000 + 6000).index).toBe(2);
  });

  it("records the fully completed sets when ended early", () => {
    let run = tick(startRun(short, 0), 5000 + 7000 + 3000 + 7000);
    expect(run.phases[run.index]?.kind).toBe("setrest");
    run = endRun(run, 23_000);
    expect(resultOf(run)).toMatchObject({ ended: true, setsDone: 1, pct: 50 });
  });

  it("advances a ground pull after its lifts and counts missed lifts", () => {
    const pulls = { ...blockPulls, reps: 2, sets: 1 };
    let run = tick(startRun(pulls, 0), 5000);
    run = logLift(run, true, 6000);
    run = logLift(run, false, 7000);
    expect(run.finished).not.toBeNull();
    expect(resultOf(run)).toMatchObject({ ended: false, pct: 50, misses: 1, work: 1 });
  });
});

describe("trends", () => {
  it("keeps a partial above the best completed as the top attempt", () => {
    const series = [
      session({ date: "2026-09-01", loadKg: 2 }),
      session({ date: "2026-09-08", loadKg: 4 }),
      session({ date: "2026-09-15", loadKg: 6, pct: 80 }),
    ];
    const summary = summarise(series, "2026-09-29")!;
    expect(summary.best).toBe(4);
    expect(summary.first).toBe(2);
    expect(summary.last).toBe(4);
    expect(summary.completed).toBe(2);
    expect(summary.latest).toBe(6);
    expect(summary.topAttempt?.loadKg).toBe(6);
    expect(summary.avgPct).toBe(93);
  });

  it("has no best until a session is complete", () => {
    const series = [
      session({ date: "2026-09-01", loadKg: 2, pct: 50 }),
      session({ date: "2026-09-08", loadKg: 0, pct: 80 }),
    ];
    const summary = summarise(series, "2026-09-29")!;
    expect(summary.best).toBeNull();
    expect(summary.first).toBeNull();
    expect(summary.last).toBeNull();
    expect(summary.completed).toBe(0);
    expect(summary.latest).toBe(0);
    expect(summary.topAttempt?.loadKg).toBe(2);
  });
});

describe("isCalendarDate", () => {
  it("accepts real dates and rejects impossible or malformed ones", () => {
    expect(isCalendarDate("2026-02-28")).toBe(true);
    expect(isCalendarDate("2028-02-29")).toBe(true);
    expect(isCalendarDate("2026-02-29")).toBe(false);
    expect(isCalendarDate("2026-13-01")).toBe(false);
    expect(isCalendarDate("2026-3-1")).toBe(false);
    expect(isCalendarDate("2026-03-01T00:00")).toBe(false);
  });
});
