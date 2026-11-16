import { describe, expect, it } from "vitest";
import {
  buildManualSession,
  historySession,
  manualSessionBody,
  parseClimbs,
  withKeptLength,
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

  it("counts a circuit as one climb however many laps it holds", () => {
    const laps = { unit: "moves", target: 32, laps: [32, 32, 32, 32, 32] } as const;
    const climb = { grade: { scale: "v", value: 3 }, endurance: laps };
    const threeCircuits = manualSessionBody.parse({
      date: "2026-09-16",
      startTime: "18:00",
      endTime: "19:30",
      location: "indoor",
      climbs: [climb, climb, climb],
    });
    const input = buildManualSession("manual-1", threeCircuits, []);
    expect(input.climb_count).toBe(3);
    expect(input.title).toContain("3 climbs");
  });
});

describe("unscored sessions", () => {
  const climbs = [{ grade: { scale: "v", value: 3 } }];

  it("accepts a body with no location and no times", () => {
    expect(
      manualSessionBody.safeParse({ date: "2026-09-16", unscored: true, climbs }).success
    ).toBe(true);
    const atCrag = [{ ...climbs[0], areaId: "crag" }];
    expect(manualSessionBody.safeParse({ date: "2026-09-16", climbs: atCrag }).success).toBe(true);
    expect(
      manualSessionBody.safeParse({ date: "2026-09-16", location: "indoor", climbs: atCrag })
        .success
    ).toBe(false);
    expect(
      manualSessionBody.safeParse({
        date: "2026-09-16",
        location: "indoor",
        climbs: [{ ...atCrag[0], name: "Arete" }],
      }).success
    ).toBe(true);
  });

  it.each([
    [{}, "computed", null],
    [{ rpe: 7 }, "user", null],
    [{ unscored: true, rpe: 7 }, "none", null],
    [{ unscored: true, gymId: "gym" }, "none", "indoor"],
    [{ climbs: [{ ...climbs[0], areaId: "crag" }] }, "computed", "outdoor"],
    [{ location: "indoor" }, "computed", "indoor"],
  ] as const)(
    "records the rpe source and derives the location for %j",
    (extra, source, location) => {
      const parsed = manualSessionBody.parse({ date: "2026-09-16", climbs, ...extra });
      const input = buildManualSession("manual-1", parsed, []);
      expect(input.rpe_source).toBe(source);
      expect(input.location).toBe(location);
    }
  );
});

describe("session length", () => {
  const climbs = [{ grade: { scale: "v", value: 3 } }];
  const built = (extra: Record<string, unknown>) =>
    buildManualSession(
      "manual-1",
      manualSessionBody.parse({ date: "2026-09-16", climbs, ...extra }),
      []
    );
  const span = (row: { start_at: string; end_at: string }) => [
    row.start_at.slice(11, 16),
    row.end_at.slice(11, 16),
  ];

  it.each([
    [{}, "none", ["12:00", "13:30"]],
    [{ minutes: 45 }, "duration", ["12:00", "12:45"]],
    [{ minutes: null }, "none", ["12:00", "13:30"]],
    [{ startTime: "18:00", minutes: 45 }, "both", ["18:00", "18:45"]],
    [{ endTime: "20:00", minutes: 45 }, "both", ["19:15", "20:00"]],
    [{ startTime: "18:00", endTime: "19:00", minutes: 45 }, "both", ["18:00", "19:00"]],
  ] as const)("stores %j as %s", (extra, times, [start, end]) => {
    const row = built(extra);
    expect(row.times).toBe(times);
    expect(span(row)).toEqual([start, end]);
  });

  it("rejects a length outside 1 to 720 minutes", () => {
    for (const minutes of [0, 721, 1.5]) {
      expect(manualSessionBody.safeParse({ date: "2026-09-16", climbs, minutes }).success).toBe(
        false
      );
    }
  });

  it("keeps a stored length through an edit that says nothing about it", () => {
    const stored = built({ minutes: 45 });
    const silent = manualSessionBody.parse({ date: "2026-09-16", climbs });
    expect(withKeptLength(silent, stored).minutes).toBe(45);
    const cleared = manualSessionBody.parse({ date: "2026-09-16", climbs, minutes: null });
    expect(withKeptLength(cleared, stored).minutes).toBeNull();
    expect(withKeptLength(silent, built({})).minutes).toBeUndefined();
  });
});
