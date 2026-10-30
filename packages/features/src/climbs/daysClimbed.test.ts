import { describe, expect, it } from "vitest";
import { daysClimbed } from "./daysClimbed";

const NOW = new Date("2026-10-28T12:00:00.000Z");

const at = (start_at: string, location: "indoor" | "outdoor" | null) => ({ start_at, location });

describe("daysClimbed", () => {
  it("draws a column per week of the range, ending on this week", () => {
    expect(daysClimbed([], "1m", NOW).strip).toEqual([]);
    expect(daysClimbed([], "3m", NOW).weeks).toHaveLength(13);
    expect(daysClimbed([], "1y", NOW).weeks).toHaveLength(53);
  });

  it("colours each day by where the climbing was, outside winning a day with both", () => {
    const vm = daysClimbed(
      [
        at("2026-10-26T09:00:00.000Z", "indoor"),
        at("2026-10-26T18:00:00.000Z", "outdoor"),
        at("2026-10-27T18:00:00.000Z", "indoor"),
        at("2026-10-27T20:00:00.000Z", null),
      ],
      "7d",
      NOW
    );
    expect(vm.weeks).toEqual([]);
    expect(vm.strip).toEqual([
      { weekday: "T", day: "rest" },
      { weekday: "F", day: "rest" },
      { weekday: "S", day: "rest" },
      { weekday: "S", day: "rest" },
      { weekday: "M", day: "outside" },
      { weekday: "T", day: "gym" },
      { weekday: "W", day: "rest" },
    ]);
    expect([vm.outside, vm.gym]).toEqual([1, 1]);
    expect(vm.label).toBe("Days climbing, Last 7 days: 1 outside, 1 in the gym.");
  });

  it("draws 7D across the week boundary, the last seven days and no further", () => {
    const vm = daysClimbed(
      [at("2026-10-21T10:00:00.000Z", "indoor"), at("2026-10-22T10:00:00.000Z", "outdoor")],
      "7d",
      NOW
    );
    expect(vm.strip[0]).toEqual({ weekday: "T", day: "outside" });
    expect([vm.outside, vm.gym]).toEqual([1, 0]);
  });

  it("counts every day drawn, the weeks before this one too", () => {
    const vm = daysClimbed(
      [at("2026-08-08T10:00:00.000Z", "outdoor"), at("2026-10-01T10:00:00.000Z", "indoor")],
      "3m",
      NOW
    );
    expect(vm.weeks[0]?.days[5]).toBe("outside");
    expect([vm.outside, vm.gym]).toEqual([1, 1]);
  });

  it("names a column by the month starting in it, and the first by its own", () => {
    const vm = daysClimbed([], "3m", NOW);
    expect(vm.weeks.map((w) => w.month).filter((m) => m !== null)).toEqual(["Aug", "Sep", "Oct"]);
    expect(vm.weeks[4]?.month).toBe("Sep");
    expect(vm.weekdays).toEqual(["M", "", "W", "", "F", "", "S"]);
  });
});
