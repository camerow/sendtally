import { describe, expect, it } from "vitest";
import {
  blockEnd,
  blockWeekOn,
  changeFrom,
  defaultPattern,
  doneAsPrescribed,
  doseProtocol,
  hangboardSeconds,
  hangItemSeconds,
  intervalsOf,
  nextVariation,
  occurrencesIn,
  occursOn,
  prescription,
  protocolDose,
  timeUnitsOf,
  upcomingVariations,
  type Block,
  type Dose,
  type Membership,
  type WeekChange,
  type Workout,
} from ".";

const block: Block = { id: "b", name: "Winter base", start: "2026-11-02", weeks: 6 };

const squat: Workout = {
  id: "squat",
  kind: "strength",
  name: "Back squat",
  description: "Alternate five sets of five with three sets of ten.",
  minutes: 45,
  targetRpe: 8,
  variations: [
    {
      label: "5×5",
      items: [{ exercise: "Back squat", dose: { sets: 5, reps: 5, weightKg: 100 } }],
    },
    {
      label: "3×10",
      items: [{ exercise: "Back squat", dose: { sets: 3, reps: 10, weightKg: 75 } }],
    },
  ],
  pattern: [0, 1],
  exerciseRestS: 0,
};

const change = (over: Partial<WeekChange> & Pick<WeekChange, "change">): WeekChange => ({
  membershipId: "m",
  week: 4,
  variation: 0,
  item: 0,
  ...over,
});

describe("blocks", () => {
  it("numbers weeks from the start and knows nothing outside the block", () => {
    expect(blockEnd(block)).toBe("2026-12-14");
    expect.soft(blockWeekOn(block, "2026-11-01")).toBeNull();
    expect.soft(blockWeekOn(block, "2026-11-02")).toBe(1);
    expect.soft(blockWeekOn(block, "2026-11-08")).toBe(1);
    expect.soft(blockWeekOn(block, "2026-11-09")).toBe(2);
    expect.soft(blockWeekOn(block, "2026-12-13")).toBe(6);
    expect.soft(blockWeekOn(block, "2026-12-14")).toBeNull();
  });
});

describe("occursOn", () => {
  const tuesFri: Pick<Membership, "weekdays" | "start"> = { weekdays: [1, 4], start: "2026-11-03" };

  it.each([
    ["before its start", "2026-10-27", null, false],
    ["on a planned weekday", "2026-11-03", null, true],
    ["on another weekday", "2026-11-04", null, false],
    ["far ahead with no block", "2027-06-04", null, true],
    ["inside its block", "2026-12-11", block, true],
    ["after its block", "2026-12-15", block, false],
  ] as const)("%s", (_, date, inBlock, expected) => {
    expect(occursOn(tuesFri, inBlock, date)).toBe(expected);
  });
});

describe("one-off days", () => {
  const once: Pick<Membership, "weekdays" | "start"> = { weekdays: [], start: "2026-11-05" };

  it.each([
    ["the day before", "2026-11-04", null, false],
    ["its day", "2026-11-05", null, true],
    ["the same weekday a week on", "2026-11-12", null, false],
    ["its day inside its block", "2026-11-05", block, true],
    ["its day outside its block", "2026-11-05", { start: "2026-11-09", weeks: 2 }, false],
  ] as const)("lands on %s: %s", (_, date, inBlock, expected) => {
    expect(occursOn(once, inBlock, date)).toBe(expected);
  });
});

describe("occurrencesIn", () => {
  const memberships: Membership[] = [
    { id: "weekly", workoutId: "squat", blockId: null, weekdays: [1, 4], start: "2026-11-03" },
    { id: "once", workoutId: "rep73", blockId: null, weekdays: [], start: "2026-11-04" },
    { id: "blocked", workoutId: "rep73", blockId: "b", weekdays: [0], start: "2026-11-02" },
    { id: "orphan", workoutId: "rep73", blockId: "gone", weekdays: [0], start: "2026-11-02" },
  ];

  it("lists every planned date in the range, by date, the end left out", () => {
    expect(occurrencesIn(memberships, [block], "2026-11-01", "2026-11-09")).toEqual([
      { date: "2026-11-02", membershipId: "blocked", workoutId: "rep73", blockId: "b" },
      { date: "2026-11-03", membershipId: "weekly", workoutId: "squat", blockId: null },
      { date: "2026-11-04", membershipId: "once", workoutId: "rep73", blockId: null },
      { date: "2026-11-06", membershipId: "weekly", workoutId: "squat", blockId: null },
    ]);
  });

  it("stops a block's memberships at its end", () => {
    const days = occurrencesIn(memberships, [block], "2026-12-07", "2026-12-22");
    expect(days.filter((d) => d.membershipId === "blocked").map((d) => d.date)).toEqual([
      "2026-12-07",
    ]);
  });

  it("is empty for an empty range", () => {
    expect(occurrencesIn(memberships, [block], "2026-11-09", "2026-11-09")).toEqual([]);
  });
});

describe("prescription", () => {
  it.each([
    ["no block is always as written", [change({ change: { weightKg: 95 } })], null, 0, 100, 5],
    ["a week without changes is as written", [change({ change: { weightKg: 95 } })], 3, 0, 100, 5],
    [
      "a week lays its change over the dose",
      [change({ change: { sets: 3, weightKg: 95 } })],
      4,
      0,
      95,
      3,
    ],
    ["another variation keeps its own ladder", [change({ change: { sets: 1 } })], 4, 1, 75, 3],
    [
      "another membership's change does not apply",
      [change({ membershipId: "other", change: { sets: 1 } })],
      4,
      0,
      100,
      5,
    ],
  ] as const)("%s", (_, changes, week, variation, weightKg, sets) => {
    const [item] = prescription(changes, { workout: squat, membershipId: "m", variation, week });
    expect(item?.dose).toMatchObject({ weightKg, sets });
  });

  it("is empty for a variation that no longer exists", () => {
    expect(prescription([], { workout: squat, membershipId: "m", variation: 5, week: 1 })).toEqual(
      []
    );
  });
});

describe("changeFrom", () => {
  it("keeps only the fields that differ from the workout as written", () => {
    const written: Dose = { sets: 5, reps: 5, weightKg: 100 };
    expect(changeFrom(written, { sets: 3, reps: 5, weightKg: 95 })).toEqual({
      sets: 3,
      weightKg: 95,
    });
    expect(changeFrom(written, written)).toEqual({});
    expect(changeFrom(written, { sets: 5, onS: 8 })).toEqual({ onS: 8 });
  });
});

describe("rotation by session", () => {
  it.each([
    ["A, B starts on A", [0, 1], [], [0, 1, 0]],
    ["A, B after A is B", [0, 1], [0], [1, 0, 1]],
    ["A, B after A, B is A", [0, 1], [0, 1], [0, 1, 0]],
    ["A, A, B after one A is A", [0, 0, 1], [0], [0, 1, 0]],
    ["A, A, B after two A is B", [0, 0, 1], [0, 0], [1, 0, 0]],
    ["A, A, B after B is A", [0, 0, 1], [0, 0, 1], [0, 0, 1]],
    ["A, A, B after B then A is A", [0, 0, 1], [1, 0], [0, 1, 0]],
    ["A, B, C after C is A", [0, 1, 2], [2], [0, 1, 2]],
    ["one variation is always it", [0], [0, 0], [0, 0, 0]],
    ["an empty pattern runs the first", [], [], [0, 0, 0]],
  ] as const)("%s", (_, pattern, trail, upcoming) => {
    expect(upcomingVariations(pattern, trail, 3)).toEqual(upcoming);
  });

  it("goes by the last session logged against the membership, whatever day it was", () => {
    const sessions = [
      { membershipId: "m", variation: 0, date: "2026-11-03" },
      { membershipId: "other", variation: 0, date: "2026-11-05" },
      { membershipId: "m", variation: null, date: "2026-11-06" },
    ];
    expect(nextVariation(squat, sessions, "m")).toBe(1);
    expect(nextVariation(squat, [], "m")).toBe(0);
  });

  it("defaults to every variation in turn", () => {
    expect(defaultPattern(1)).toEqual([0]);
    expect(defaultPattern(2)).toEqual([0, 1]);
    expect(defaultPattern(3)).toEqual([0, 1, 2]);
  });
});

describe("hangboard doses", () => {
  it.each([
    [
      "repeaters hang with rest between",
      { sets: 3, reps: 6, onS: 7, offS: 3, setRestS: 180 },
      { kind: "hang", hangS: 7, restS: 3, reps: 6, sets: 3, setRestS: 180 },
    ],
    [
      "no time on the edge is a ground pull",
      { sets: 5, reps: 5, setRestS: 120 },
      { kind: "pull", hangS: 0, restS: 0, reps: 5, sets: 5, setRestS: 120 },
    ],
  ] as const)("%s", (_, dose, protocol) => {
    const p = doseProtocol("Repeaters", dose);
    expect(p).toEqual({ name: "Repeaters", ...protocol });
    expect(doseProtocol("Repeaters", protocolDose(p))).toEqual(p);
  });

  it("reads whole minutes as minutes", () => {
    expect(timeUnitsOf({ hangS: 7, restS: 0, setRestS: 180 })).toEqual({
      hangS: "s",
      restS: "s",
      setRestS: "min",
    });
  });
});

describe("hangboard duration", () => {
  it.each([
    // sets × hangs × (hang time + rest time) + sets × set rest
    [{ sets: 6, reps: 6, onS: 7, offS: 3, setRestS: 180 }, 6 * 6 * (7 + 3) + 6 * 180],
    [{ sets: 5, reps: 1, onS: 10, setRestS: 180 }, 5 * 1 * (10 + 0) + 5 * 180],
    [{ sets: 3, reps: 6, onS: 7, offS: 3 }, 3 * 6 * (7 + 3)],
    [{ sets: 5, reps: 5, setRestS: 120 }, 5 * 5 * 6 + 5 * 120],
  ] satisfies [Dose, number][])("counts %o as %i seconds", (dose, seconds) => {
    expect(hangItemSeconds(dose)).toBe(seconds);
  });

  it("adds the rest between exercises between items, not after the last", () => {
    const item = (dose: Dose) => ({ exercise: "half", dose });
    const a = item({ sets: 3, reps: 6, onS: 7, offS: 3, setRestS: 120 });
    const b = item({ sets: 5, reps: 1, onS: 10, setRestS: 180 });
    expect(hangboardSeconds([], 180)).toBe(0);
    expect(hangboardSeconds([a], 180)).toBe(540);
    expect(hangboardSeconds([a, b], 180)).toBe(540 + 180 + 950);
    expect(hangboardSeconds([a, b, a], 90)).toBe(540 + 90 + 950 + 90 + 540);
  });
});

describe("intervalsOf", () => {
  it("runs items as a circuit of timed and counted steps", () => {
    expect(
      intervalsOf([
        { exercise: "Plank", dose: { sets: 3, onS: 45, offS: 15 } },
        { exercise: "Knee raises", dose: { sets: 3, reps: 10, offS: 60 } },
      ])
    ).toEqual({
      rounds: 3,
      steps: [
        { label: "Plank", measure: "time", seconds: 45, restAfter: 15 },
        { label: "Knee raises", measure: "count", count: 10, restAfter: 60 },
      ],
    });
  });
});

describe("doneAsPrescribed", () => {
  it("logs every set of every item", () => {
    expect(doneAsPrescribed(squat.variations[0]?.items ?? [])).toEqual([
      {
        item: 0,
        exercise: "Back squat",
        sets: Array.from({ length: 5 }, () => ({ reps: 5, weightKg: 100 })),
      },
    ]);
  });
});
