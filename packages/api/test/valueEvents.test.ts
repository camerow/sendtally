import { env } from "cloudflare:test";
import { expect, it, vi } from "vitest";
import * as posthog from "../src/lib/posthog";
import { testApp } from "./harness";

const call = async (
  user: string,
  method: string,
  path: string,
  body?: unknown
): Promise<Response> =>
  testApp().request(
    path,
    {
      method,
      headers: { "x-test-user": user, "Content-Type": "application/json" },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    },
    env
  );

const pullDay = {
  kind: "strength",
  name: "Pull day",
  description: "",
  minutes: 45,
  targetRpe: 8,
  exerciseRestS: 120,
  items: [
    {
      id: "i1",
      exercise: "Weighted pull-up",
      doses: [
        { sets: 5, reps: 5, weightKg: 10, setRestS: 120 },
        { sets: 3, reps: 8, weightKg: 0 },
      ],
      group: { id: "g1", rounds: 3, restBetweenS: 30, restRoundS: 120 },
    },
    {
      id: "i2",
      exercise: "Ring row",
      doses: [{ sets: 3, reps: 10 }],
      group: { id: "g1", rounds: 3, restBetweenS: 30, restRoundS: 120 },
    },
  ],
};

it("captures each thing made once, marked onboarding while a path runs", async () => {
  const user = "user_value_events";
  const capture = vi.spyOn(posthog, "captureUserEvent").mockResolvedValue();
  vi.spyOn(posthog, "identifyUser").mockResolvedValue();
  const made = () =>
    capture.mock.calls
      .filter(([, , event]) => /_created$|_scheduled$/.test(event))
      .map(([, , event, properties]) => [event, properties] as const);
  try {
    await call(user, "PUT", "/v1/preferences/first-run", { step: "started" });
    await call(user, "PUT", "/v1/preferences/first-run", {
      step: "path",
      path: "plan",
      from: "chooser",
    });
    for (let i = 0; i < 2; i++) {
      await call(user, "PUT", "/v1/exercises/e1", { name: "Ring row", kind: "strength" });
      const saved = await call(user, "PUT", "/v1/workouts/w1", pullDay);
      expect(saved.status, await saved.clone().text()).toBe(200);
      await call(user, "PUT", "/v1/blocks/b1", {
        name: "",
        description: "",
        start: null,
        weeks: 4,
        focus: null,
      });
      await call(user, "PUT", "/v1/memberships/m1", {
        workoutId: "w1",
        blockId: "b1",
        weekdays: [1, 4],
        start: "2026-11-23",
        position: 0,
      });
    }
    expect(made()).toEqual([
      ["exercise_created", { kind: "strength", measure: "repsWeight", onboarding: true }],
      [
        "workout_created",
        {
          kind: "strength",
          exercise_count: 2,
          from_library: 0,
          superset_count: 1,
          alternating_count: 1,
          rest_set: true,
          onboarding: true,
        },
      ],
      ["block_created", { weeks: 4, onboarding: true }],
      ["block_scheduled", { weekday_count: 2, onboarding: true }],
    ]);

    capture.mockClear();
    await call(user, "PUT", "/v1/preferences/first-run", {
      step: "skipped",
      path: "plan",
      at: "P4",
    });
    await call(user, "PUT", "/v1/exercises/e2", { name: "Dead hang", kind: "strength" });
    expect(made()).toEqual([
      ["exercise_created", { kind: "strength", measure: "repsWeight", onboarding: false }],
    ]);
  } finally {
    vi.restoreAllMocks();
  }
});
