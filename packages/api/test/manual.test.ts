import { describe, expect, it } from "vitest";
import {
  buildManualSession,
  historySession,
  manualSessionBody,
  parseClimbs,
} from "../src/lib/manual";

const endurance = { unit: "moves", target: 32, laps: [32, 32, 24] } as const;

function body(climb: Record<string, unknown>): Record<string, unknown> {
  return {
    date: "2026-09-16",
    startTime: "18:00",
    endTime: "19:30",
    location: "indoor",
    climbs: [climb],
  };
}

describe("endurance validation", () => {
  const rejected: Array<[string, Record<string, unknown>]> = [
    [
      "a lap over its target",
      { grade: { scale: "v", value: 3 }, endurance: { ...endurance, laps: [33] } },
    ],
    ["an attempt", { grade: { scale: "v", value: 3 }, kind: "attempt", endurance }],
    ["a flash", { grade: { scale: "v", value: 3 }, style: "flash", endurance }],
    ["more than one try", { grade: { scale: "v", value: 3 }, tries: 2, endurance }],
    ["no laps", { grade: { scale: "v", value: 3 }, endurance: { ...endurance, laps: [] } }],
  ];

  it.each(rejected)("rejects %s", (_name, climb) => {
    expect(manualSessionBody.safeParse(body(climb)).success).toBe(false);
  });

  it("accepts a valid endurance climb", () => {
    const parsed = manualSessionBody.safeParse(
      body({ grade: { scale: "v", value: 3 }, endurance })
    );
    expect(parsed.success).toBe(true);
    expect(parsed.data?.climbs[0]?.endurance).toEqual(endurance);
  });

  it("accepts an unnamed timed circuit", () => {
    const parsed = manualSessionBody.safeParse(
      body({
        grade: { scale: "yds", value: "5.10c" },
        endurance: { unit: "seconds", target: 720, laps: [720] },
      })
    );
    expect(parsed.success).toBe(true);
  });
});

describe("endurance round trip", () => {
  const form = manualSessionBody.parse(
    body({ name: "Red 40", grade: { scale: "v", value: 3 }, endurance })
  );

  it("keeps the endurance out of the stored top grades", () => {
    const input = buildManualSession("manual-1", form, []);
    expect(input.top_grade).toBe(-1);
    expect(input.top_send_grade).toBe(-1);
    expect(input.top_grade_label).toBeNull();
    expect(input.top_send_grade_label).toBeNull();
  });

  it("writes endurance into climbs_json and reads it back through history", () => {
    const input = buildManualSession("manual-1", form, []);
    expect(parseClimbs(input.climbs_json)[0]?.endurance).toEqual(endurance);

    const history = historySession(input);
    expect(history?.climbs[0]?.endurance).toEqual(endurance);
  });

  it("scores the same before and after the history round trip", () => {
    const first = buildManualSession("manual-1", form, []);
    const history = historySession(first);
    expect(history).not.toBeNull();
    const rescored = buildManualSession("manual-2", form, [history!]);
    const dropped = buildManualSession("manual-2", form, [
      { ...history!, climbs: history!.climbs.map(({ endurance: _drop, ...c }) => c) },
    ]);
    expect(rescored.rpe).toBe(6);
    expect(dropped.rpe).not.toBe(rescored.rpe);
  });
});
