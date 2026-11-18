import { describe, expect, it } from "vitest";
import type { ActivityRecord, HangSessionRecord } from "@sendtally/api-client";
import type { HangSettings, SetClimb } from "@sendtally/core/hang";
import { exerciseSeries } from "../statistics";
import { activityItem, exerciseItems, hangItem } from "./historyItems";

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

describe("hangItem", () => {
  const protocol = {
    name: "Repeaters",
    kind: "hang" as const,
    hangS: 7,
    restS: 3,
    reps: 6,
    sets: 1,
    setRestS: 0,
  };
  const names: Record<string, string> = {
    half: "Half crimp",
    open: "Open hand",
    front3: "Front 3",
  };
  const model = {
    gripName: (id: string): string => names[id] ?? id,
    settings: { units: "kg" } as HangSettings,
  };
  const session = (done: HangSessionRecord["done"]): HangSessionRecord =>
    ({
      id: "s",
      date: "2026-11-16",
      gripId: "half",
      edgeMm: 20,
      loadKg: 5,
      pct: 100,
      rpe: 8,
      protocol,
      done,
    }) as HangSessionRecord;
  const set = (reps: number) => ({ reps, onS: 7, edgeMm: 20, weightKg: 5 });

  it("names every grip a session ran and counts its hangs, leaving the load off", () => {
    const item = hangItem(
      session([
        { item: 0, exercise: "half", sets: [set(6)] },
        { item: 1, exercise: "open", dose: { sets: 1, reps: 6, onS: 7 }, sets: [set(4)] },
        { item: 2, exercise: "front3", dose: { sets: 1, reps: 6, onS: 7 }, sets: [set(5)] },
      ]),
      model,
      "s"
    );
    expect(item.name).toBe("Half crimp, Open hand, Front 3 (this session)");
    expect(item.meta).toBe("15 of 18 hangs");
  });

  it("keeps a one-grip session's grip and load", () => {
    const item = hangItem(session([{ item: 0, exercise: "half", sets: [set(6)] }]), model);
    expect(item.name).toBe("Half crimp");
    expect(item.meta).toBe("+5 kg · 6 of 6 hangs");
  });
});

describe("a workout's History row", () => {
  it("carries a checklist's count after the time, as the log row does", () => {
    const list = {
      item: 0,
      exercise: "Checklist",
      sets: [],
      checklist: { lines: ["a", "b", "c", "d"], checked: [0, 1, 3] },
    };
    const activity = {
      id: "a",
      title: "Warm-up",
      date: "2026-11-17",
      minutes: 1,
      rpe: 5,
      done: [list],
    } as unknown as ActivityRecord;
    expect(activityItem(activity, "kg").meta).toBe("1 min · Checklist · 3 of 4");
  });
});
