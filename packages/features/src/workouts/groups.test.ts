import { describe, expect, it } from "vitest";
import type { SessionItem } from "@sendtally/core/hang";
import {
  memberSetLabel,
  restAfterGroupTick,
  restPreviewAfter,
  roundOn,
  runGroupsOf,
  supersetHeadAt,
  supersetMembers,
  supersetRoundTitle,
  supersetRoundsTitle,
  withRunGroups,
} from "./groups";
import { exercisePosition, setKey } from "./setsRun";

const group = { id: "s", rounds: 2, restBetweenS: 30, restRoundS: 120 };
const member = (exercise: string, g = group): SessionItem => ({
  exercise,
  dose: { sets: g.rounds, reps: 6 },
  group: g,
});
const plank: SessionItem = { exercise: "Plank", dose: { sets: 2, onS: 45 } };
const items = [member("A"), member("B"), member("C"), plank];
const ticks = (...keys: [number, number][]): Set<string> =>
  new Set(keys.map(([item, set]) => setKey({ item, set })));

describe("a superset in the run", () => {
  it("is the neighbours sharing a group in the cards' order, and a member alone is a plain exercise", () => {
    expect(runGroupsOf([0, 1, 2, 3], items).map((g) => g.members)).toEqual([[0, 1, 2]]);
    expect(runGroupsOf([0, 1, 3, 2], items).map((g) => g.members)).toEqual([[0, 1]]);
    expect(runGroupsOf([0, 3, 1, 2], items).map((g) => g.members)).toEqual([[1, 2]]);
    expect(runGroupsOf([0, 3, 2], items)).toEqual([]);
  });

  it("never groups an item the climbing tally runs", () => {
    expect(runGroupsOf([0, 1, 2, 3], items, (k) => k !== 0).map((g) => g.members)).toEqual([
      [1, 2],
    ]);
  });

  it("rests between members, after each round, then before the next exercise", () => {
    const [g] = runGroupsOf([0, 1, 2, 3], items);
    expect(restAfterGroupTick(items, ticks([0, 0]), { item: 0, set: 0 }, g!, 90)).toEqual({
      at: "0:0",
      seconds: 30,
      next: null,
    });
    const round = ticks([0, 0], [1, 0], [2, 0]);
    expect(restAfterGroupTick(items, round, { item: 2, set: 0 }, g!, 90)).toEqual({
      at: "2:0",
      seconds: 120,
      next: null,
    });
    const all = ticks([0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1]);
    expect(restAfterGroupTick(items, all, { item: 2, set: 1 }, g!, 90)).toEqual({
      at: "after:2",
      seconds: 90,
      next: 3,
    });
  });

  it("has no rest at all between members when the rest between them is none", () => {
    const quick = { ...group, restBetweenS: 0 };
    const none = [member("A", quick), member("B", quick)];
    const [g] = runGroupsOf([0, 1], none);
    expect(restAfterGroupTick(none, ticks([0, 0]), { item: 0, set: 0 }, g!, 90)).toBeNull();
  });

  it("counts a superset once in 'Exercise n of m'", () => {
    const groups = runGroupsOf([0, 1, 2, 3], items);
    const unit = (k: number): string | null =>
      groups.find((g) => g.members.includes(k))?.id ?? String(k);
    expect(exercisePosition([0, 1, 2, 3], 1, unit)).toEqual({ at: 1, of: 2 });
    expect(exercisePosition([0, 1, 2, 3], 3, unit)).toEqual({ at: 2, of: 2 });
  });

  it("logs each member with its superset and the rounds it ran", () => {
    const groups = runGroupsOf([0, 1, 2, 3], items);
    const done = [0, 1, 3].map((item) => ({ item, exercise: "x", sets: [{}, {}, {}] }));
    expect(withRunGroups(done, groups).map((d) => d.group)).toEqual([
      { id: "s", rounds: 3 },
      { id: "s", rounds: 3 },
      undefined,
    ]);
  });
});

describe("a superset's words", () => {
  it("names its round, its members and its rounds", () => {
    expect(supersetRoundTitle(2, 3)).toBe("Superset · Round 2 of 3");
    expect(supersetMembers(["A", "B", "C"])).toBe("A + B + C");
    expect(supersetRoundsTitle(3)).toBe("Superset · 3 rounds");
    expect(memberSetLabel(1, 0)).toBe("B1");
  });

  it("says which round is on", () => {
    const g = runGroupsOf([0, 1, 2, 3], items)[0]!;
    expect(roundOn(items, ticks([0, 0], [1, 0], [2, 0]), g)).toBe(2);
  });
});

describe("the rest under a superset's row", () => {
  it("is the rest between members within a round, the round's rest after its last, none after the last round", () => {
    const g = runGroupsOf([0, 1, 2, 3], items)[0]!;
    const sets = (): number => 2;
    expect(restPreviewAfter(g, sets, 0, 0)).toBe(30);
    expect(restPreviewAfter(g, sets, 2, 0)).toBe(120);
    expect(restPreviewAfter(g, sets, 2, 1)).toBeNull();
    expect(restPreviewAfter({ ...g, restBetweenS: 0 }, sets, 0, 0)).toBeNull();
  });
});

describe("a superset's head over its logged members", () => {
  const g = { id: "s", rounds: 3 };
  it("heads two or more members logged together, never one alone or split apart", () => {
    expect([
      supersetHeadAt([{ group: g }, { group: g }], 0),
      supersetHeadAt([{ group: g }, { group: g }], 1),
    ]).toEqual(["Superset · 3 rounds", null]);
    expect(supersetHeadAt([{ group: g }, {}], 0)).toBeNull();
    const split = [{ group: g }, {}, { group: g }];
    expect(split.map((_, i) => supersetHeadAt(split, i))).toEqual([null, null, null]);
  });
});
