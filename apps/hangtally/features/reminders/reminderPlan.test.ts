import { describe, expect, it } from "@jest/globals";
import { LIBRARY, type HangSession, type Schedule } from "@sendtally/core/hang";
import { reminderMoment, reminderPlan } from "./reminderPlan";

const plan: Schedule = {
  id: "p",
  workoutId: "rep73",
  gripId: "half",
  days: [0, 2],
  start: "2026-09-28",
  end: null,
  skip: ["2026-10-05"],
};

const logged = (date: string): HangSession => ({
  id: date,
  workoutId: "rep73",
  gripId: "half",
  date,
  loadKg: 0,
  pct: 100,
  misses: 0,
  rpe: null,
  protocol: LIBRARY[0]!,
});

describe("reminderPlan", () => {
  it("skips skipped dates and days already logged", () => {
    const dates = reminderPlan([plan], [logged("2026-09-30")], "2026-09-28", 10).map((r) => r.date);
    expect(dates).toEqual(["2026-09-28", "2026-10-07"]);
  });

  it("fires at the chosen local time", () => {
    const at = reminderMoment("2026-10-07", "07:30");
    expect([at.getFullYear(), at.getMonth(), at.getDate(), at.getHours(), at.getMinutes()]).toEqual(
      [2026, 9, 7, 7, 30]
    );
  });
});
