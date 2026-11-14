import { describe, expect, it } from "vitest";
import { hangResult } from "./hangResult";

const dose = { sets: 2, reps: 6, onS: 7 };
const prescribed = [{ exercise: "half", dose }];
const at = { exercise: "half", setup: { edgeMm: 20, loadKg: 5 }, hang: true };

describe("a hangboard session's result", () => {
  it("scores held seconds against the plan and counts hangs short of it as misses", () => {
    const kept = [
      {
        item: 0,
        exercise: "x",
        sets: [
          { reps: 6, onS: 7 },
          { reps: 4, onS: 7 },
        ],
      },
    ];
    expect(hangResult(kept, prescribed, () => at)).toEqual({
      done: [
        {
          item: 0,
          exercise: "half",
          sets: [
            { reps: 6, onS: 7, edgeMm: 20, weightKg: 5 },
            { reps: 4, onS: 7, edgeMm: 20, weightKg: 5 },
          ],
        },
      ],
      pct: 83,
      misses: 2,
    });
  });

  it("does not miss a set left out, and holds a set with no time of its own for its dose", () => {
    const kept = [{ item: 0, exercise: "x", sets: [{ reps: 6, weightKg: 10 }] }];
    const result = hangResult(kept, prescribed, () => ({ ...at, hang: false }));
    expect(result).toMatchObject({ pct: 50, misses: 0 });
    expect(result.done[0]?.sets).toEqual([{ reps: 6, weightKg: 10 }]);
  });
});
