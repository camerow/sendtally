import { describe, expect, it } from "vitest";
import type { ActivityRecord } from "@sendtally/api-client";
import type { SetClimb } from "@sendtally/core/hang";
import { exerciseSeries } from "../statistics";
import { exerciseItems } from "./historyItems";

const climb = (grade: string, sent = true): SetClimb => ({ grade, scale: "v", tries: 1, sent });

describe("exerciseItems", () => {
  it("reads a climbing session over all its sets, not its best set", () => {
    const activity = {
      id: "a",
      kind: "climbing",
      title: "Capacity night",
      date: "2026-11-12",
      startTime: null,
      minutes: 60,
      rpe: 7,
      notes: null,
      workoutId: null,
      membershipId: null,
      week: null,
      done: [
        {
          item: 0,
          exercise: "Capacity boulders",
          sets: [
            { climbs: [climb("V3"), climb("V4")] },
            { climbs: [climb("V5"), climb("V6", false)] },
          ],
        },
      ],
    } as unknown as ActivityRecord;
    const [series] = exerciseSeries([activity]);
    const items = series === undefined ? [] : exerciseItems(series, [activity], "kg");
    expect(items[0]?.meta).toBe("4 climbs · 3 sent · top V5");
  });
});
