import { describe, expect, it } from "vitest";
import {
  cardsOf,
  finishedInOrder,
  withCardAdded,
  withCardEnded,
  withCardFold,
  withCardMoved,
  withUnitMoved,
  withCardRemoved,
  withCardSkipped,
  withoutSet,
  withSetBack,
} from "./runCards";

describe("a run's cards", () => {
  it("starts in the workout's order with nothing skipped", () => {
    expect(cardsOf(3)).toEqual({
      base: 3,
      order: [0, 1, 2],
      added: [],
      skipped: [],
      ended: [],
      shut: [],
      open: [],
    });
  });

  it("moves a card up or down, and not past either end", () => {
    expect(withCardMoved(cardsOf(3), 1, -1).order).toEqual([1, 0, 2]);
    expect(withCardMoved(cardsOf(3), 1, 1).order).toEqual([0, 2, 1]);
    expect(withCardMoved(cardsOf(3), 0, -1).order).toEqual([0, 1, 2]);
    expect(withCardMoved(cardsOf(3), 2, 1).order).toEqual([0, 1, 2]);
  });

  it("skips a card to the end, and it stays there once opened again", () => {
    const skipped = withCardSkipped(cardsOf(3), 0);
    expect(skipped.order).toEqual([1, 2, 0]);
    expect(skipped.skipped).toEqual([0]);
  });

  it("removes a card from the run", () => {
    expect(withCardRemoved(cardsOf(3), 1).order).toEqual([0, 2]);
  });

  it("adds an exercise as the last card, keyed past the workout's own as it started", () => {
    const added = { exercise: "Dips", dose: { sets: 3, reps: 10 } };
    const once = withCardAdded(cardsOf(3), added);
    expect(once.order).toEqual([0, 1, 2, 3]);
    expect(once.added).toEqual([added]);
    expect(withCardAdded(withCardRemoved(once, 1), added).order).toEqual([0, 2, 3, 4]);
  });

  it("keeps a card folded or opened by hand, and lets it go back to its own state", () => {
    const shut = withCardFold(cardsOf(2), 0, true);
    expect([shut.shut, shut.open]).toEqual([[0], []]);
    const open = withCardFold(shut, 0, false);
    expect([open.shut, open.open]).toEqual([[], [0]]);
    const own = withCardFold(open, 0, null);
    expect([own.shut, own.open]).toEqual([[], []]);
  });

  it("records the order exercises end in, and forgets one that is not done after all", () => {
    const ended = withCardEnded(withCardEnded(cardsOf(3), 2, true), 0, true);
    expect(ended.ended).toEqual([2, 0]);
    expect(withCardEnded(ended, 2, false).ended).toEqual([0]);
    expect(withCardEnded(ended, 2, true).ended).toEqual([2, 0]);
  });
});

describe("removing a set", () => {
  it("renumbers the sets after it and the ticks that went with them", () => {
    const done = [
      { item: 0, exercise: "Back squat", sets: [{ reps: 5 }, { reps: 4 }, { reps: 3 }] },
      { item: 1, exercise: "Bench press", sets: [{ reps: 8 }] },
    ];
    const out = withoutSet(done, new Set(["0:0", "0:2", "1:0"]), { item: 0, set: 1 });
    expect(out.done[0]?.sets).toEqual([{ reps: 5 }, { reps: 3 }]);
    expect([...out.ticked].sort()).toEqual(["0:0", "0:1", "1:0"]);
  });

  it("keeps the card when its last set goes", () => {
    const done = [{ item: 0, exercise: "Back squat", sets: [{ reps: 5 }] }];
    const out = withoutSet(done, new Set(["0:0"]), { item: 0, set: 0 });
    expect(out.done).toEqual([{ item: 0, exercise: "Back squat", sets: [] }]);
    expect(out.ticked.size).toBe(0);
  });
});

describe("putting a removed set back", () => {
  it("returns it to its place and tick, keeping what changed since", () => {
    const done = [
      { item: 0, exercise: "Back squat", sets: [{ reps: 5 }, { reps: 4 }, { reps: 3 }] },
      { item: 1, exercise: "Bench press", sets: [{ reps: 8 }] },
    ];
    const out = withoutSet(done, new Set(["0:1", "0:2"]), { item: 0, set: 1 });
    const later = new Set([...out.ticked, "0:0", "1:0"]);
    const back = withSetBack(out.done, later, { item: 0, set: 1 }, { reps: 4 }, true);
    expect(back.done[0]?.sets).toEqual([{ reps: 5 }, { reps: 4 }, { reps: 3 }]);
    expect([...back.ticked].sort()).toEqual(["0:0", "0:1", "0:2", "1:0"]);
  });
});

describe("a finished run", () => {
  it("logs finished exercises in the order they ended, the rest where they stand, removed ones left out", () => {
    const cards = { ...cardsOf(4), order: [2, 3, 0], ended: [0, 2] };
    const done = [
      { item: 0, exercise: "Back squat", sets: [{ reps: 5 }, { reps: 5 }] },
      { item: 1, exercise: "Bench press", sets: [{ reps: 8 }] },
      { item: 2, exercise: "Barbell row", sets: [{ reps: 8 }] },
      { item: 3, exercise: "Laps", sets: [] },
    ];
    const out = finishedInOrder(cards, done, new Set(["2:0", "0:0", "0:1"]));
    expect(out.done.map((d) => [d.item, d.exercise])).toEqual([
      [0, "Back squat"],
      [1, "Laps"],
      [2, "Barbell row"],
    ]);
    expect(out.off).toEqual([]);
  });
});

describe("moving a superset in the run", () => {
  const unitOf = (k: number): number[] => (k === 1 || k === 2 ? [1, 2] : [k]);
  it("moves a superset whole, and a card past a superset jumps all of it", () => {
    const cards = cardsOf(4);
    expect(withUnitMoved(cards, [1, 2], 1, unitOf).order).toEqual([0, 3, 1, 2]);
    expect(withUnitMoved(cards, [1, 2], -1, unitOf).order).toEqual([1, 2, 0, 3]);
    expect(withUnitMoved(cards, [3], -1, unitOf).order).toEqual([0, 3, 1, 2]);
    expect(withUnitMoved(cards, [0], 1, unitOf).order).toEqual([1, 2, 0, 3]);
    expect(withUnitMoved(cards, [0], -1, unitOf)).toBe(cards);
  });
});
