import { createExecutionContext, env, waitOnExecutionContext } from "cloudflare:test";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Activity, ActivityRecord } from "../src/lib/activities";
import type { Plan, WorkoutRecord } from "../src/lib/plan";
import { encryptSecret } from "../src/lib/crypto";
import { jsonResponse, makeFakeFetch } from "./fakes";
import { testApp } from "./harness";

afterEach(() => vi.unstubAllGlobals());

const activityBody = {
  kind: "strength",
  title: "Leg day",
  date: "2026-10-01",
  startTime: "18:30",
  minutes: 50,
  rpe: 7,
  notes: null,
  workoutId: null,
  membershipId: null,
  week: null,
  focus: null,
  done: [],
};

const squatDone = [
  {
    item: 0,
    exercise: "Back squat",
    sets: [
      { reps: 5, weightKg: 100 },
      { reps: 4, weightKg: 100 },
    ],
  },
  { item: 1, exercise: "Copenhagen plank", sets: [{ onS: 30 }] },
];

const squatWorkout = {
  kind: "strength",
  name: "Back squat",
  description: "Alternate five sets of five with three sets of ten.",
  minutes: 45,
  targetRpe: 8,
  items: [
    {
      exercise: "Back squat",
      doses: [
        { sets: 5, reps: 5, weightKg: 100 },
        { sets: 3, reps: 10, weightKg: 75 },
      ],
    },
  ],
  exerciseRestS: 120,
};

const blockBody = { name: "Winter base", start: "2026-11-02", weeks: 6, focus: null };

const membershipBody = {
  workoutId: "w1",
  blockId: "b1",
  weekdays: [4, 1],
  start: "2026-11-02",
};

async function call(
  userId: string,
  method: string,
  path: string,
  body?: unknown
): Promise<Response> {
  return testApp().request(
    path,
    {
      method,
      headers: { "x-test-user": userId, "Content-Type": "application/json" },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    },
    env
  );
}

const json = async <T>(res: Response): Promise<T> => (await res.json()) as T;

const plan = async (userId: string): Promise<Plan> =>
  json<Plan>(await call(userId, "GET", "/v1/plan"));

describe("activities", () => {
  it("round trips an activity and replays the same PUT as an edit", async () => {
    const userId = "user_activity_roundtrip";
    expect((await call(userId, "PUT", "/v1/activities/a1", activityBody)).status).toBe(200);
    const edited = await call(userId, "PUT", "/v1/activities/a1", { ...activityBody, rpe: 8 });
    expect(await json<{ activity: Activity }>(edited)).toEqual({
      activity: {
        id: "a1",
        ...activityBody,
        rpe: 8,
        stravaActivityId: null,
        postedAt: null,
        postState: null,
        postError: null,
      },
    });
    const list = await json<{ activities: Activity[] }>(
      await call(userId, "GET", "/v1/activities")
    );
    expect(list.activities.map((a) => [a.id, a.rpe])).toEqual([["a1", 8]]);
  });

  it("filters by an inclusive date range, newest first", async () => {
    const userId = "user_activity_range";
    for (const [id, date] of [
      ["a1", "2026-09-30"],
      ["a2", "2026-10-01"],
      ["a3", "2026-10-02"],
      ["a4", "2026-10-03"],
    ]) {
      await call(userId, "PUT", `/v1/activities/${id}`, { ...activityBody, date });
    }
    const res = await call(userId, "GET", "/v1/activities?from=2026-10-01&to=2026-10-02");
    const { activities } = await json<{ activities: Activity[] }>(res);
    expect(activities.map((a) => a.id)).toEqual(["a3", "a2"]);
  });

  it("round trips what was done and the plan it ran", async () => {
    const userId = "user_activity_done";
    const body = {
      ...activityBody,
      workoutId: "w1",
      membershipId: "m1",
      week: 4,
      done: squatDone,
    };
    const res = await call(userId, "PUT", "/v1/activities/a1", body);
    expect(await json(res)).toMatchObject({ activity: { id: "a1", ...body } });
  });

  it("records a focus, and keeps it when an older app edits without one", async () => {
    const userId = "user_activity_focus";
    await call(userId, "PUT", "/v1/activities/a1", { ...activityBody, focus: "power" });
    const { focus: _, ...older } = activityBody;
    const res = await call(userId, "PUT", "/v1/activities/a1", { ...older, rpe: 8 });
    expect(await json(res)).toMatchObject({ activity: { rpe: 8, focus: "power" } });
  });

  it("reads an older client's body, with no plan and nothing done, as logged on its own", async () => {
    const userId = "user_activity_older";
    const { workoutId: _, membershipId: __, week: ___, done: ____, ...older } = activityBody;
    const res = await call(userId, "PUT", "/v1/activities/a1", older);
    expect(await json(res)).toMatchObject({
      activity: { workoutId: null, membershipId: null, week: null, done: [] },
    });
  });

  it("rejects a kind, rpe, date or done outside the shape", async () => {
    const userId = "user_activity_invalid";
    for (const body of [
      { ...activityBody, kind: "climb" },
      { ...activityBody, kind: "hangboard" },
      { ...activityBody, kind: "run" },
      { ...activityBody, rpe: 11 },
      { ...activityBody, date: "2026-02-30" },
      { ...activityBody, minutes: 0 },
      { ...activityBody, week: 0 },
      { ...activityBody, done: [{ item: 0, exercise: " ", sets: [] }] },
      { ...activityBody, done: [{ item: -1, exercise: "Squat", sets: [] }] },
      { ...activityBody, done: [{ item: 0, exercise: "Squat", sets: [{ reps: -1 }] }] },
    ]) {
      expect((await call(userId, "PUT", "/v1/activities/a1", body)).status).toBe(400);
    }
  });

  it("keeps a climbing workout's climbs in its sets", async () => {
    const userId = "user_activity_climbs";
    const done = [
      {
        item: 0,
        exercise: "4x4s",
        sets: [
          {
            climbs: [
              { grade: "V4", scale: "v", tries: 1, sent: true, style: "flash" },
              { grade: "V3", scale: "v", tries: 2, sent: false },
            ],
          },
        ],
      },
      {
        item: 1,
        exercise: "ARC",
        sets: [
          {
            onS: 1200,
            climbs: [
              {
                grade: "",
                scale: "v",
                tries: 1,
                sent: true,
                circuit: { id: "c1", label: "Green", colour: "green" },
              },
            ],
          },
        ],
      },
    ];
    const body = { ...activityBody, kind: "climbing", done };
    const res = await call(userId, "PUT", "/v1/activities/a1", body);
    expect((await json<{ activity: Activity }>(res)).activity.done).toEqual(done);
    const bad = done.map((d) => ({
      ...d,
      sets: [{ climbs: [{ grade: "V4", scale: "v", tries: 0, sent: true }] }],
    }));
    expect((await call(userId, "PUT", "/v1/activities/a2", { ...body, done: bad })).status).toBe(
      400
    );
  });

  it("deletes only the caller's own activity", async () => {
    await call("user_activity_owner", "PUT", "/v1/activities/a1", activityBody);
    const other = await call("user_activity_other", "DELETE", "/v1/activities/a1");
    expect(await json(other)).toEqual({ deleted: false });
    const own = await call("user_activity_owner", "DELETE", "/v1/activities/a1");
    expect(await json(own)).toEqual({ deleted: true });
  });

  it("lists activities beside climbing and hang sessions", async () => {
    const userId = "user_activity_log";
    await call(userId, "PUT", "/v1/activities/a1", activityBody);
    for (const path of ["/v1/sessions", "/v1/sessions?include=climbs"]) {
      const body = await json<{ sessions: unknown[]; activities: Activity[] }>(
        await call(userId, "GET", path)
      );
      expect(body.sessions).toEqual([]);
      expect(body.activities.map((a) => a.id)).toEqual(["a1"]);
    }
  });
});

describe("workouts", () => {
  it("round trips items and their doses, edits in place and lists oldest first", async () => {
    const userId = "user_workouts_roundtrip";
    await call(userId, "PUT", "/v1/workouts/w1", squatWorkout);
    await call(userId, "PUT", "/v1/workouts/w2", {
      ...squatWorkout,
      kind: "hangboard",
      name: "Repeaters",
      items: [
        { exercise: "half", doses: [{ sets: 3, reps: 6, onS: 7, offS: 3, edgeMm: 20 }] },
        { exercise: "open", doses: [{ sets: 3, reps: 1, onS: 10, setRestS: 120 }] },
      ],
      exerciseRestS: 240,
    });
    await call(userId, "PUT", "/v1/workouts/w1", { ...squatWorkout, name: "Squat" });
    const { workouts } = await json<{ workouts: WorkoutRecord[] }>(
      await call(userId, "GET", "/v1/workouts")
    );
    expect(workouts.map((w) => [w.id, w.kind, w.name])).toEqual([
      ["w1", "strength", "Squat"],
      ["w2", "hangboard", "Repeaters"],
    ]);
    expect(workouts[0]).toMatchObject({ ...squatWorkout, name: "Squat" });
    expect(workouts[1]?.exerciseRestS).toBe(240);
  });

  it("saves a focus, and keeps it when an older app sends none", async () => {
    const userId = "user_workouts_focus";
    await call(userId, "PUT", "/v1/workouts/w1", { ...squatWorkout, focus: "strength" });
    const { focus: _, ...older } = { ...squatWorkout, focus: null };
    const kept = await call(userId, "PUT", "/v1/workouts/w1", { ...older, name: "Squat" });
    expect(await json(kept)).toMatchObject({ workout: { name: "Squat", focus: "strength" } });
    const cleared = await call(userId, "PUT", "/v1/workouts/w1", { ...squatWorkout, focus: null });
    expect(await json(cleared)).toMatchObject({ workout: { focus: null } });
    const bad = await call(userId, "PUT", "/v1/workouts/w1", { ...squatWorkout, focus: "speed" });
    expect(bad.status).toBe(400);
  });

  it("keeps a dose's name, trimmed, and never asks for one", async () => {
    const userId = "user_workouts_dose_names";
    const named = {
      ...squatWorkout,
      items: [{ exercise: "Back squat", doses: [{ sets: 5, name: " Heavy " }, { sets: 3 }] }],
    };
    const res = await call(userId, "PUT", "/v1/workouts/w1", named);
    expect(await json(res)).toMatchObject({
      workout: { items: [{ doses: [{ sets: 5, name: "Heavy" }, { sets: 3 }] }] },
    });
  });

  it("rests between exercises on the hangboard only when an older app sends no rest", async () => {
    const userId = "user_workouts_exercise_rest";
    const { exerciseRestS: _, ...noRest } = squatWorkout;
    const strength = await call(userId, "PUT", "/v1/workouts/w1", noRest);
    expect(await json(strength)).toMatchObject({ workout: { exerciseRestS: 0 } });
    const hang = await call(userId, "PUT", "/v1/workouts/w2", { ...noRest, kind: "hangboard" });
    expect(await json(hang)).toMatchObject({ workout: { exerciseRestS: 180 } });
  });

  it("folds an older app's variations into items where their exercises line up", async () => {
    const userId = "user_workouts_variations";
    const { items: _, ...rest } = squatWorkout;
    const squat = (dose: object): object => ({ items: [{ exercise: "Back squat", dose }] });
    const folded = await call(userId, "PUT", "/v1/workouts/w1", {
      ...rest,
      variations: [
        { label: "5×5", ...squat({ sets: 5 }) },
        { label: "", ...squat({ sets: 3 }) },
      ],
      pattern: [0, 0, 1],
    });
    expect(await json(folded)).toMatchObject({
      workout: { items: [{ exercise: "Back squat", doses: [{ sets: 5 }, { sets: 3 }] }] },
    });
    const kept = await call(userId, "PUT", "/v1/workouts/w2", {
      ...rest,
      variations: [squat({ sets: 5 }), { items: [{ exercise: "Deadlift", dose: { sets: 3 } }] }],
    });
    expect(await json(kept)).toMatchObject({
      workout: { items: [{ exercise: "Back squat", doses: [{ sets: 5 }] }] },
    });
  });

  it("keeps an empty description and a climbing workout with no items", async () => {
    const userId = "user_workouts_climb";
    const climb = {
      kind: "climbing",
      name: "Limit bouldering",
      description: "",
      minutes: 90,
      targetRpe: 9,
      items: [],
      exerciseRestS: 0,
    };
    const res = await call(userId, "PUT", "/v1/workouts/w1", climb);
    expect(await json(res)).toMatchObject({ workout: climb });
  });

  it("rejects a workout out of shape", async () => {
    const userId = "user_workouts_invalid";
    for (const body of [
      { ...squatWorkout, kind: "run" },
      { ...squatWorkout, name: " " },
      { ...squatWorkout, items: [{ exercise: "Squat", doses: [] }] },
      { ...squatWorkout, targetRpe: 11 },
      { ...squatWorkout, exerciseRestS: -1 },
      { ...squatWorkout, items: [{ exercise: "Squat", doses: [{ sets: 0 }] }] },
      { ...squatWorkout, items: [{ exercise: "Squat", doses: [{ reps: 5 }] }] },
      { ...squatWorkout, items: [{ exercise: "Squat", doses: [{ sets: 5, name: " " }] }] },
      {
        ...squatWorkout,
        items: [{ exercise: "Squat", doses: [{ sets: 5, name: "x".repeat(25) }] }],
      },
    ]) {
      expect((await call(userId, "PUT", "/v1/workouts/w1", body)).status).toBe(400);
    }
  });

  it("leaves every block when deleted, and its sessions keep what was done", async () => {
    const userId = "user_workouts_delete";
    await call(userId, "PUT", "/v1/workouts/w1", squatWorkout);
    await call(userId, "PUT", "/v1/blocks/b1", blockBody);
    await call(userId, "PUT", "/v1/memberships/m1", membershipBody);
    await call(userId, "PUT", "/v1/memberships/m2", { ...membershipBody, blockId: null });
    await call(userId, "PUT", "/v1/memberships/m3", { ...membershipBody, workoutId: "other" });
    await call(userId, "PUT", "/v1/memberships/m1/changes", {
      week: 4,
      dose: 0,
      item: 0,
      change: { sets: 3 },
    });
    await call(userId, "PUT", "/v1/activities/a1", {
      ...activityBody,
      workoutId: "w1",
      membershipId: "m1",
      week: 4,
      done: squatDone,
    });

    expect(await json(await call(userId, "DELETE", "/v1/workouts/w1"))).toEqual({
      deleted: true,
    });
    const after = await plan(userId);
    expect(after.memberships.map((m) => m.id)).toEqual(["m3"]);
    expect(after.weekChanges).toEqual([]);
    expect(after.blocks.map((b) => b.id)).toEqual(["b1"]);
    const { activities } = await json<{ activities: Activity[] }>(
      await call(userId, "GET", "/v1/activities")
    );
    expect(activities[0]).toMatchObject({
      workoutId: "w1",
      membershipId: null,
      week: null,
      done: squatDone,
    });
  });

  it("takes a planned built-in out of every block, though it has no row", async () => {
    const userId = "user_workouts_builtin";
    await call(userId, "PUT", "/v1/memberships/m1", {
      ...membershipBody,
      workoutId: "rep73",
      blockId: null,
    });
    expect(await json(await call(userId, "DELETE", "/v1/workouts/rep73"))).toEqual({
      deleted: false,
    });
    expect((await plan(userId)).memberships).toEqual([]);
  });
});

describe("blocks and memberships", () => {
  it("reads the whole plan, sorting weekdays", async () => {
    const userId = "user_plan_roundtrip";
    await call(userId, "PUT", "/v1/blocks/b1", blockBody);
    const saved = await call(userId, "PUT", "/v1/memberships/m1", membershipBody);
    expect(await json(saved)).toEqual({
      membership: { id: "m1", ...membershipBody, weekdays: [1, 4] },
    });
    await call(userId, "PUT", "/v1/memberships/m2", {
      ...membershipBody,
      blockId: null,
      start: "2026-10-05",
    });
    expect(await plan(userId)).toEqual({
      blocks: [{ id: "b1", ...blockBody }],
      memberships: [
        { id: "m2", ...membershipBody, blockId: null, start: "2026-10-05", weekdays: [1, 4] },
        { id: "m1", ...membershipBody, weekdays: [1, 4] },
      ],
      weekChanges: [],
    });
  });

  it("rejects another user's block and plans out of shape", async () => {
    await call("user_plan_owner", "PUT", "/v1/blocks/b1", blockBody);
    const userId = "user_plan_invalid";
    expect((await call(userId, "PUT", "/v1/memberships/m1", membershipBody)).status).toBe(400);
    for (const body of [
      { ...membershipBody, blockId: null, weekdays: [1, 1] },
      { ...membershipBody, blockId: null, weekdays: [7] },
      { ...membershipBody, blockId: null, start: "2026-02-30" },
    ]) {
      expect((await call(userId, "PUT", "/v1/memberships/m1", body)).status).toBe(400);
    }
    for (const body of [
      { ...blockBody, weeks: 0 },
      { ...blockBody, weeks: 17 },
      { ...blockBody, name: "" },
    ]) {
      expect((await call(userId, "PUT", "/v1/blocks/b1", body)).status).toBe(400);
    }
  });

  it("keeps a one-off as a membership with no weekdays", async () => {
    const userId = "user_plan_once";
    const once = { workoutId: "rep73", blockId: null, weekdays: [], start: "2026-11-05" };
    const res = await call(userId, "PUT", "/v1/memberships/m1", once);
    expect(await json(res)).toEqual({ membership: { id: "m1", ...once } });
  });

  it("keeps only what a week changes, and an empty change puts it back as written", async () => {
    const userId = "user_plan_weeks";
    await call(userId, "PUT", "/v1/blocks/b1", blockBody);
    await call(userId, "PUT", "/v1/memberships/m1", membershipBody);
    const change = { week: 4, dose: 0, item: 0, change: { sets: 3, weightKg: 95 } };
    const res = await call(userId, "PUT", "/v1/memberships/m1/changes", change);
    expect(await json(res)).toEqual({ weekChange: { membershipId: "m1", ...change } });
    await call(userId, "PUT", "/v1/memberships/m1/changes", { ...change, change: { sets: 2 } });
    await call(userId, "PUT", "/v1/memberships/m1/changes", { ...change, week: 5 });
    expect((await plan(userId)).weekChanges).toEqual([
      { membershipId: "m1", ...change, change: { sets: 2 } },
      { membershipId: "m1", ...change, week: 5 },
    ]);
    await call(userId, "PUT", "/v1/memberships/m1/changes", { ...change, change: {} });
    expect((await plan(userId)).weekChanges.map((c) => c.week)).toEqual([5]);
  });

  it("404s a week change for a membership that does not exist, and rejects one out of shape", async () => {
    const userId = "user_plan_weeks_invalid";
    const change = { week: 1, dose: 0, item: 0, change: { sets: 3 } };
    expect((await call(userId, "PUT", "/v1/memberships/m1/changes", change)).status).toBe(404);
    await call(userId, "PUT", "/v1/memberships/m1", { ...membershipBody, blockId: null });
    for (const body of [
      { ...change, week: 0 },
      { ...change, week: 17 },
      { ...change, dose: -1 },
      { ...change, change: { sets: 0 } },
    ]) {
      expect((await call(userId, "PUT", "/v1/memberships/m1/changes", body)).status).toBe(400);
    }
  });

  it("deletes a membership with its week changes and unlinks its sessions", async () => {
    const userId = "user_plan_delete";
    await call(userId, "PUT", "/v1/memberships/m1", { ...membershipBody, blockId: null });
    await call(userId, "PUT", "/v1/memberships/m1/changes", {
      week: 1,
      dose: 0,
      item: 0,
      change: { sets: 3 },
    });
    await call(userId, "PUT", "/v1/activities/a1", { ...activityBody, membershipId: "m1" });
    expect(await json(await call(userId, "DELETE", "/v1/memberships/m1"))).toEqual({
      deleted: true,
    });
    expect(await plan(userId)).toEqual({ blocks: [], memberships: [], weekChanges: [] });
    const { activities } = await json<{ activities: Activity[] }>(
      await call(userId, "GET", "/v1/activities")
    );
    expect(activities.map((a) => [a.id, a.membershipId])).toEqual([["a1", null]]);
  });

  it("deletes a block with its memberships, leaving those outside it", async () => {
    const userId = "user_plan_block_delete";
    await call(userId, "PUT", "/v1/blocks/b1", blockBody);
    await call(userId, "PUT", "/v1/memberships/m1", membershipBody);
    await call(userId, "PUT", "/v1/memberships/m2", { ...membershipBody, blockId: null });
    await call(userId, "PUT", "/v1/memberships/m1/changes", {
      week: 1,
      dose: 0,
      item: 0,
      change: { sets: 3 },
    });
    expect(await json(await call(userId, "DELETE", "/v1/blocks/b1"))).toEqual({ deleted: true });
    const after = await plan(userId);
    expect(after.blocks).toEqual([]);
    expect(after.memberships.map((m) => m.id)).toEqual(["m2"]);
    expect(after.weekChanges).toEqual([]);
  });

  it("deletes every training row with the account", async () => {
    const userId = "user_training_purge";
    await call(userId, "PUT", "/v1/blocks/b1", blockBody);
    await call(userId, "PUT", "/v1/memberships/m1", membershipBody);
    await call(userId, "PUT", "/v1/memberships/m1/changes", {
      week: 1,
      dose: 0,
      item: 0,
      change: { sets: 3 },
    });
    await call(userId, "PUT", "/v1/activities/a1", activityBody);
    await call(userId, "PUT", "/v1/workouts/w1", squatWorkout);
    expect((await call(userId, "DELETE", "/v1/account")).status).toBe(200);
    for (const table of [
      "activities",
      "memberships",
      "week_changes",
      "training_blocks",
      "workouts",
      "exercises",
    ]) {
      const row = await env.DB.prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE user_id = ?`)
        .bind(userId)
        .first<{ n: number }>();
      expect(`${table}:${row?.n}`).toBe(`${table}:0`);
    }
  });

  it("plans a block again from a new start, with its plans and week changes", async () => {
    const userId = "user_plan_again";
    await call(userId, "PUT", "/v1/blocks/b1", { ...blockBody, focus: "power" });
    await call(userId, "PUT", "/v1/memberships/m1", { ...membershipBody, start: "2026-11-04" });
    await call(userId, "PUT", "/v1/memberships/m2", { ...membershipBody, blockId: null });
    await call(userId, "PUT", "/v1/memberships/m1/changes", {
      week: 2,
      dose: 0,
      item: 0,
      change: { sets: 3 },
    });
    const copy = { id: "b2", start: "2027-01-04" };
    const res = await call(userId, "POST", "/v1/blocks/b1/copy", copy);
    expect(await json(res)).toEqual({ block: { ...blockBody, focus: "power", ...copy } });
    expect((await call(userId, "POST", "/v1/blocks/b1/copy", copy)).status).toBe(200);
    const after = await plan(userId);
    const copied = after.memberships.filter((m) => m.blockId === "b2");
    expect(copied.map((m) => [m.workoutId, m.start, m.weekdays])).toEqual([
      ["w1", "2027-01-06", [1, 4]],
    ]);
    expect(after.weekChanges.filter((c) => c.membershipId === copied[0]?.id)).toEqual([
      { membershipId: copied[0]?.id, week: 2, dose: 0, item: 0, change: { sets: 3 } },
    ]);
    expect((await call(userId, "POST", "/v1/blocks/nope/copy", copy)).status).toBe(404);
  });
});

type ExerciseList = { exercises: { id: string; name: string; kind: string }[] };

const exerciseNames = async (userId: string): Promise<string[]> =>
  (await json<ExerciseList>(await call(userId, "GET", "/v1/exercises"))).exercises.map(
    (e) => e.name
  );

describe("exercises", () => {
  it("lists every name a workout or activity writes once, leaving grips out", async () => {
    const userId = "user_exercises_upsert";
    await call(userId, "PUT", "/v1/workouts/w1", squatWorkout);
    await call(userId, "PUT", "/v1/activities/a1", { ...activityBody, done: squatDone });
    await call(userId, "PUT", "/v1/activities/a2", {
      ...activityBody,
      done: [{ item: 0, exercise: "back SQUAT", sets: [] }],
    });
    await call(userId, "PUT", "/v1/workouts/w2", {
      ...squatWorkout,
      kind: "hangboard",
      items: [{ exercise: "half-crimp", doses: [{ sets: 1 }] }],
    });
    expect(await exerciseNames(userId)).toEqual(["Back squat", "Copenhagen plank"]);
  });

  it("renames an exercise in every workout and activity naming it", async () => {
    const userId = "user_exercises_rename";
    await call(userId, "PUT", "/v1/workouts/w1", squatWorkout);
    await call(userId, "PUT", "/v1/activities/a1", { ...activityBody, done: squatDone });
    const { exercises } = await json<ExerciseList>(await call(userId, "GET", "/v1/exercises"));
    const squat = exercises.find((e) => e.name === "Back squat");
    const plank = exercises.find((e) => e.name === "Copenhagen plank");
    const res = await call(userId, "PUT", `/v1/exercises/${squat?.id}`, {
      name: "High-bar squat",
      kind: "strength",
    });
    expect(await json(res)).toEqual({
      exercise: {
        id: squat?.id,
        name: "High-bar squat",
        kind: "strength",
        measure: "repsWeight",
        eachSide: false,
        progress: null,
        builtIn: null,
        archived: false,
      },
    });
    const { workouts } = await json<{ workouts: WorkoutRecord[] }>(
      await call(userId, "GET", "/v1/workouts")
    );
    expect(workouts[0]?.items.map((i) => i.exercise)).toEqual(["High-bar squat"]);
    const { activities } = await json<{ activities: ActivityRecord[] }>(
      await call(userId, "GET", "/v1/activities")
    );
    expect(activities[0]?.done.map((d) => d.exercise)).toEqual([
      "High-bar squat",
      "Copenhagen plank",
    ]);
    const taken = await call(userId, "PUT", `/v1/exercises/${squat?.id}`, {
      name: "copenhagen plank",
      kind: "strength",
    });
    expect(taken.status).toBe(409);
    expect(await json(taken)).toMatchObject({ exercise: { id: plank?.id } });
  });

  it("merges one exercise into another everywhere and drops it", async () => {
    const userId = "user_exercises_merge";
    await call(userId, "PUT", "/v1/activities/a1", { ...activityBody, done: squatDone });
    await call(userId, "PUT", "/v1/exercises/e1", { name: "Squat", kind: "strength" });
    const { exercises } = await json<ExerciseList>(await call(userId, "GET", "/v1/exercises"));
    const squat = exercises.find((e) => e.name === "Back squat");
    expect(
      (await call(userId, "POST", `/v1/exercises/${squat?.id}/merge`, { into: "e1" })).status
    ).toBe(200);
    expect(await exerciseNames(userId)).toEqual(["Copenhagen plank", "Squat"]);
    const { activities } = await json<{ activities: ActivityRecord[] }>(
      await call(userId, "GET", "/v1/activities")
    );
    expect(activities[0]?.done.map((d) => d.exercise)).toEqual(["Squat", "Copenhagen plank"]);
    expect((await call(userId, "POST", "/v1/exercises/e1/merge", { into: "e1" })).status).toBe(400);
    expect((await call(userId, "POST", "/v1/exercises/e9/merge", { into: "e1" })).status).toBe(404);
  });

  it("saves how an exercise is measured, starting a new one on its category's measure", async () => {
    const userId = "user_exercises_measure";
    const pigeon = await call(userId, "PUT", "/v1/exercises/e1", {
      name: "Pigeon",
      kind: "mobility",
      eachSide: true,
      builtIn: "pigeon",
    });
    expect(await json(pigeon)).toMatchObject({
      exercise: { measure: "seconds", eachSide: true, builtIn: "pigeon" },
    });
    const climb = await call(userId, "PUT", "/v1/exercises/e2", { name: "4x4", kind: "climbing" });
    expect(await json(climb)).toMatchObject({
      exercise: { kind: "climbing", measure: "reps", progress: null },
    });
    const graded = await call(userId, "PUT", "/v1/exercises/e2", {
      name: "4x4",
      kind: "climbing",
      progress: "topGrade",
    });
    expect(await json(graded)).toMatchObject({ exercise: { progress: "topGrade" } });
    const older = await call(userId, "PUT", "/v1/exercises/e2", {
      name: "4 x 4",
      kind: "climbing",
    });
    expect(await json(older)).toMatchObject({ exercise: { progress: "topGrade" } });
    const renamed = await call(userId, "PUT", "/v1/exercises/e1", {
      name: "Pigeon pose",
      kind: "mobility",
    });
    expect(await json(renamed)).toMatchObject({
      exercise: { measure: "seconds", eachSide: true, builtIn: "pigeon" },
    });
  });

  it("deletes an exercise nothing uses and archives one in use, back when made again", async () => {
    const userId = "user_exercises_remove";
    await call(userId, "PUT", "/v1/workouts/w1", squatWorkout);
    await call(userId, "PUT", "/v1/exercises/e1", { name: "Dips", kind: "strength" });
    const { exercises } = await json<ExerciseList>(await call(userId, "GET", "/v1/exercises"));
    const squat = exercises.find((e) => e.name === "Back squat");

    expect(await json(await call(userId, "DELETE", "/v1/exercises/e1"))).toEqual({
      removed: "deleted",
    });
    expect(await json(await call(userId, "DELETE", `/v1/exercises/${squat?.id}`))).toEqual({
      removed: "archived",
    });
    expect(await exerciseNames(userId)).toEqual(["Back squat"]);
    expect((await call(userId, "DELETE", "/v1/exercises/e9")).status).toBe(404);

    const again = await call(userId, "PUT", "/v1/exercises/e2", {
      name: "back squat",
      kind: "strength",
    });
    expect(await json(again)).toMatchObject({ exercise: { id: squat?.id, archived: false } });
  });
});

async function send(
  userId: string,
  method: string,
  path: string,
  body: unknown,
  fetchImpl: typeof fetch
): Promise<Response> {
  const ctx = createExecutionContext();
  const res = await testApp(fetchImpl).request(
    path,
    {
      method,
      headers: { "x-test-user": userId, "Content-Type": "application/json" },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    },
    env,
    ctx
  );
  await waitOnExecutionContext(ctx);
  return res;
}

async function connectStrava(userId: string, postTraining: boolean): Promise<void> {
  await env.DB.prepare(
    `INSERT OR IGNORE INTO users (id, timezone, created_at) VALUES (?, 'UTC', '')`
  )
    .bind(userId)
    .run();
  await env.DB.prepare(
    `INSERT INTO strava_connections
       (user_id, athlete_id, access_token_ciphertext, refresh_token_ciphertext, expires_at,
        status, connected_at, posting_enabled, post_training)
     VALUES (?, 999, ?, ?, ?, 'active', '', 1, ?)`
  )
    .bind(
      userId,
      await encryptSecret("access-tok", env.TOKEN_KEY),
      await encryptSecret("refresh-tok", env.TOKEN_KEY),
      Math.floor(Date.now() / 1000) + 86_400,
      postTraining ? 1 : 0
    )
    .run();
}

function stravaRoutes(activityId = 616161) {
  return makeFakeFetch([
    {
      match: (url, method) => url.endsWith("/api/v3/activities") && method === "POST",
      respond: () => jsonResponse(201, { id: activityId }),
    },
    {
      match: (url, method) => url.endsWith(`/api/v3/activities/${activityId}`) && method === "PUT",
      respond: () => jsonResponse(200, { id: activityId }),
    },
  ]);
}

const firstActivity = async (userId: string): Promise<ActivityRecord | undefined> =>
  (await json<{ activities: ActivityRecord[] }>(await call(userId, "GET", "/v1/activities")))
    .activities[0];

describe("activity strava posting", () => {
  it("posts a new strength activity as WeightTraining with what was done", async () => {
    const userId = "user_activity_post";
    await connectStrava(userId, true);
    const { fetchImpl, calls } = stravaRoutes();

    await send(userId, "PUT", "/v1/activities/a1", { ...activityBody, done: squatDone }, fetchImpl);

    const creates = calls.filter((c) => c.method === "POST");
    expect(creates).toHaveLength(1);
    const form = new URLSearchParams(creates[0]?.body ?? "");
    expect(form.get("sport_type")).toBe("WeightTraining");
    expect(form.get("name")).toBe("Leg day");
    expect(form.get("start_date_local")).toBe("2026-10-01T18:30:00Z");
    expect(form.get("elapsed_time")).toBe("3000");
    expect(form.get("description")).toBe(
      [
        "RPE 7/10",
        "created by https://sendtally.com",
        "Back squat 5×220.5 lb, 4×220.5 lb",
        "Copenhagen plank 30s",
      ].join("\n")
    );
    expect(await firstActivity(userId)).toMatchObject({
      stravaActivityId: "616161",
      postState: "posted",
      postError: null,
    });
  });

  it("maps kinds to sport types and lands an untimed activity at noon", async () => {
    const userId = "user_activity_kinds";
    await connectStrava(userId, true);
    const { fetchImpl, calls } = stravaRoutes();
    const done = [
      { item: 0, exercise: "Cat-cow", sets: [{ reps: 10 }] },
      { item: 1, exercise: "Deep squat hold", sets: [{}] },
      { item: 2, exercise: "Pigeon", sets: [] },
    ];
    const kinds = { mobility: "Workout", other: "Workout", strength: "WeightTraining" };
    for (const kind of Object.keys(kinds)) {
      await send(
        userId,
        "PUT",
        `/v1/activities/${kind}`,
        { ...activityBody, kind, startTime: null, rpe: null, done },
        fetchImpl
      );
    }
    const forms = calls.map((c) => new URLSearchParams(c.body));
    expect(forms.map((f) => f.get("sport_type"))).toEqual(Object.values(kinds));
    expect(forms[0]?.get("start_date_local")).toBe("2026-10-01T12:00:00Z");
    expect(forms[0]?.get("description")).toBe(
      ["created by https://sendtally.com", "Cat-cow 10", "✓ Deep squat hold"].join("\n")
    );
  });

  it("patches the activity on edit, never posts a second, and leaves it on delete", async () => {
    const userId = "user_activity_edit";
    await connectStrava(userId, true);
    const { fetchImpl, calls } = stravaRoutes();

    await send(userId, "PUT", "/v1/activities/a1", activityBody, fetchImpl);
    await send(userId, "PUT", "/v1/activities/a1", { ...activityBody, title: "Legs" }, fetchImpl);

    expect(calls.filter((c) => c.method === "POST")).toHaveLength(1);
    const updates = calls.filter((c) => c.method === "PUT");
    expect(updates).toHaveLength(1);
    expect(new URLSearchParams(updates[0]?.body ?? "").get("name")).toBe("Legs");

    await send(userId, "DELETE", "/v1/activities/a1", undefined, fetchImpl);
    expect(calls.filter((c) => c.method === "DELETE")).toHaveLength(0);
  });

  it("does not post when training posting is off, until asked for one activity", async () => {
    const userId = "user_activity_off";
    await connectStrava(userId, false);
    const { fetchImpl, calls } = stravaRoutes();

    await send(userId, "PUT", "/v1/activities/a1", activityBody, fetchImpl);
    await send(userId, "PUT", "/v1/activities/a1", { ...activityBody, rpe: 8 }, fetchImpl);
    expect(calls).toHaveLength(0);

    const res = await send(userId, "POST", "/v1/activities/a1/strava", undefined, fetchImpl);
    expect(res.status).toBe(200);
    const { activity } = await json<{ activity: ActivityRecord }>(res);
    expect(activity).toMatchObject({ stravaActivityId: "616161", postState: "posted", rpe: 8 });

    await send(userId, "POST", "/v1/activities/a1/strava", undefined, fetchImpl);
    expect(calls.filter((c) => c.method === "POST")).toHaveLength(1);
  });

  it("records a rate limit as a failed post that a retry can finish", async () => {
    const userId = "user_activity_rate";
    await connectStrava(userId, true);
    const limited = makeFakeFetch([
      { match: () => true, respond: () => jsonResponse(429, { message: "Rate Limit Exceeded" }) },
    ]);

    await send(userId, "PUT", "/v1/activities/a1", activityBody, limited.fetchImpl);
    expect(await firstActivity(userId)).toMatchObject({
      postState: "failed",
      postError: "strava rate limit hit, not posted yet",
      stravaActivityId: null,
    });

    const { fetchImpl } = stravaRoutes();
    const res = await send(userId, "POST", "/v1/activities/a1/strava", undefined, fetchImpl);
    expect(res.status).toBe(200);
    expect(await firstActivity(userId)).toMatchObject({ postState: "posted" });
  });

  it("404s a post for an activity that does not exist", async () => {
    const res = await call("user_activity_missing", "POST", "/v1/activities/nope/strava");
    expect(res.status).toBe(404);
  });

  it("turns training posting on and reports it from status", async () => {
    const userId = "user_activity_toggle";
    await connectStrava(userId, false);
    const res = await call(userId, "PUT", "/v1/connections/strava/training-posting", {
      enabled: true,
    });
    expect(await json<unknown>(res)).toEqual({ postTraining: true });
    expect(await json<unknown>(await call(userId, "GET", "/v1/status"))).toMatchObject({
      strava: { postTraining: true },
    });
  });

  it("409s the training preference without a Strava connection", async () => {
    const res = await call(
      "user_activity_nostrava",
      "PUT",
      "/v1/connections/strava/training-posting",
      {
        enabled: true,
      }
    );
    expect(res.status).toBe(409);
  });
});

// A one-shot data move, exercised against the same SQL the migration applies.
describe("climbing measures backfill", () => {
  const backfill = async (): Promise<void> => {
    const sql = await import("../migrations/0051_climbing_tally_measures.sql?raw");
    await env.DB.prepare(sql.default).run();
  };

  const seedExercise = (
    id: string,
    name: string,
    kind: string,
    measure: string,
    builtIn: string | null
  ) =>
    env.DB.prepare(
      `INSERT INTO exercises (user_id, id, name, name_key, kind, measure, built_in, created_at, updated_at)
       VALUES ('u_measures', ?, ?, lower(?), ?, ?, ?, '', '')`
    )
      .bind(id, name, name, kind, measure, builtIn)
      .run();

  it("moves unlogged climbing exercises onto climbs or time on the wall", async () => {
    await env.DB.prepare(
      `INSERT OR IGNORE INTO users (id, timezone, created_at) VALUES ('u_measures', 'UTC', '')`
    ).run();
    await seedExercise("e1", "4x4s", "climbing", "rounds", "fourByFours");
    await seedExercise("e2", "ARC", "climbing", "rounds", "arc");
    await seedExercise("e3", "Logged laps", "climbing", "rounds", null);
    await seedExercise("e4", "Plank", "other", "rounds", null);
    await env.DB.prepare(
      `INSERT INTO activities (user_id, id, kind, title, date, minutes, done_json, created_at, updated_at)
       VALUES ('u_measures', 'a1', 'other', 'Laps', '2026-10-01', 30, ?, '', '')`
    )
      .bind(JSON.stringify([{ item: 0, exercise: "Logged laps", sets: [{ onS: 240 }] }]))
      .run();

    await backfill();

    const rows = await env.DB.prepare(
      `SELECT id, measure FROM exercises WHERE user_id = 'u_measures' ORDER BY id`
    ).all<{ id: string; measure: string }>();
    expect(rows.results).toEqual([
      { id: "e1", measure: "reps" },
      { id: "e2", measure: "seconds" },
      { id: "e3", measure: "rounds" },
      { id: "e4", measure: "rounds" },
    ]);
  });
});
