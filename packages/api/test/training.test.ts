import { createExecutionContext, env, waitOnExecutionContext } from "cloudflare:test";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Activity, ActivityRecord, PlanItem } from "../src/lib/activities";
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
  planItemId: "p1",
  workoutId: null,
  detail: null,
};

const planBody = {
  kind: "strength",
  title: "Gym, legs",
  days: [1, 3],
  perWeek: null,
  start: "2026-09-28",
  end: null,
  skip: [],
  minutes: 60,
  targetRpe: 7,
  projectId: null,
  template: null,
};

const setsDetail = {
  kind: "sets",
  exercises: [
    {
      name: "Back squat",
      measures: ["reps", "loadKg"],
      sets: [
        { reps: 5, loadKg: 100, done: true },
        { reps: 4, loadKg: 100, done: false },
      ],
    },
    {
      name: "Copenhagen plank",
      measures: ["seconds", "side"],
      sets: [{ seconds: 30, side: "L", done: true }],
    },
  ],
};

const intervalsTemplate = {
  kind: "intervals",
  rounds: 2,
  steps: [
    { label: "Couch stretch", measure: "time", seconds: 45, side: "each", restAfter: 10 },
    { label: "Swing", measure: "count", count: 15, loadKg: 24, restAfter: 30, cue: "Hips" },
  ],
};

const checklistTemplate = {
  kind: "checklist",
  items: [
    { text: "Cat-cow", dose: "× 10" },
    { text: "Deep squat hold", dose: "2 min" },
  ],
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

  it("round trips a sets, checklist or intervals body", async () => {
    const userId = "user_activity_detail";
    const checklist = {
      kind: "checklist",
      items: [{ text: "Cat-cow", dose: "× 10", done: true }],
    };
    const intervals = {
      ...intervalsTemplate,
      stepsDone: [
        { round: 0, step: 0, side: "L" },
        { round: 0, step: 0, side: "R", heldSeconds: 20 },
      ],
    };
    for (const detail of [setsDetail, intervals, checklist]) {
      const res = await call(userId, "PUT", "/v1/activities/a1", { ...activityBody, detail });
      expect(await json(res)).toMatchObject({ activity: { id: "a1", ...activityBody, detail } });
    }
    const row = await env.DB.prepare("SELECT detail_kind FROM activities WHERE user_id = ?")
      .bind(userId)
      .first<{ detail_kind: string }>();
    expect(row?.detail_kind).toBe("checklist");
  });

  it("rejects a kind, rpe or date outside the shape", async () => {
    const userId = "user_activity_invalid";
    for (const body of [
      { ...activityBody, kind: "climb" },
      { ...activityBody, rpe: 11 },
      { ...activityBody, date: "2026-02-30" },
      { ...activityBody, minutes: 0 },
      { ...activityBody, detail: { kind: "sets" } },
      { ...activityBody, detail: { kind: "sets", exercises: [] } },
      {
        ...activityBody,
        detail: { ...setsDetail, exercises: [{ name: " ", measures: ["reps"], sets: [] }] },
      },
      {
        ...activityBody,
        detail: {
          ...setsDetail,
          exercises: [{ name: "Squat", measures: ["reps", "reps"], sets: [] }],
        },
      },
      { ...activityBody, detail: { kind: "checklist", items: [{ text: "Cat-cow", dose: "" }] } },
      { ...activityBody, detail: intervalsTemplate },
      {
        ...activityBody,
        detail: {
          ...intervalsTemplate,
          stepsDone: [],
          steps: [{ label: "Plank", measure: "time", count: 10, restAfter: 0 }],
        },
      },
    ]) {
      expect((await call(userId, "PUT", "/v1/activities/a1", body)).status).toBe(400);
    }
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

describe("plan items", () => {
  it("round trips a plan item, sorting days and deduplicating skips", async () => {
    const userId = "user_plan_roundtrip";
    const res = await call(userId, "PUT", "/v1/plan-items/p1", {
      ...planBody,
      days: [3, 1],
      skip: ["2026-10-01", "2026-09-29", "2026-10-01"],
    });
    expect(res.status).toBe(200);
    const { planItems } = await json<{ planItems: PlanItem[] }>(
      await call(userId, "GET", "/v1/plan-items")
    );
    expect(planItems).toEqual([
      { id: "p1", ...planBody, skip: ["2026-09-29", "2026-10-01"], blockId: null, workoutId: null },
    ]);
  });

  it("takes a weekly goal instead of weekdays, and a project only on a climb", async () => {
    const userId = "user_plan_shapes";
    const weekly = { ...planBody, kind: "climb", days: [], perWeek: 3, projectId: "the-mandala" };
    expect((await call(userId, "PUT", "/v1/plan-items/p1", weekly)).status).toBe(200);
    for (const body of [
      { ...planBody, perWeek: 2 },
      { ...planBody, days: [] },
      { ...planBody, projectId: "the-mandala" },
      { ...planBody, end: "2026-09-28" },
      { ...planBody, days: [1, 1] },
    ]) {
      expect((await call(userId, "PUT", "/v1/plan-items/p2", body)).status).toBe(400);
    }
  });

  it("keeps a template, takes none on a climb, and reads an older client's body as none", async () => {
    const userId = "user_plan_template";
    const withTemplate = { ...planBody, template: checklistTemplate };
    const saved = await call(userId, "PUT", "/v1/plan-items/p1", withTemplate);
    expect(await json(saved)).toEqual({
      planItem: { id: "p1", ...withTemplate, blockId: null, workoutId: null },
    });
    const skipped = await call(userId, "PUT", "/v1/plan-items/p1/skip", {
      date: "2026-09-29",
      skipped: true,
    });
    expect((await json<{ planItem: PlanItem }>(skipped)).planItem.template).toEqual(
      checklistTemplate
    );
    const intervals = { ...planBody, kind: "mobility", template: intervalsTemplate };
    const timed = await call(userId, "PUT", "/v1/plan-items/p3", intervals);
    expect(await json(timed)).toEqual({
      planItem: { id: "p3", ...intervals, blockId: null, workoutId: null },
    });
    const { template: _, ...older } = planBody;
    const legacy = await call(userId, "PUT", "/v1/plan-items/p2", older);
    expect((await json<{ planItem: PlanItem }>(legacy)).planItem.template).toBeNull();
    for (const body of [
      { ...withTemplate, kind: "climb" },
      { ...planBody, template: { kind: "checklist", items: [] } },
    ]) {
      expect((await call(userId, "PUT", "/v1/plan-items/p3", body)).status).toBe(400);
    }
  });

  it("skips and restores one date", async () => {
    const userId = "user_plan_skip";
    await call(userId, "PUT", "/v1/plan-items/p1", planBody);
    const skipped = await call(userId, "PUT", "/v1/plan-items/p1/skip", {
      date: "2026-10-01",
      skipped: true,
    });
    expect((await json<{ planItem: PlanItem }>(skipped)).planItem.skip).toEqual(["2026-10-01"]);
    const restored = await call(userId, "PUT", "/v1/plan-items/p1/skip", {
      date: "2026-10-01",
      skipped: false,
    });
    expect((await json<{ planItem: PlanItem }>(restored)).planItem.skip).toEqual([]);
    const missing = await call(userId, "PUT", "/v1/plan-items/nope/skip", {
      date: "2026-10-01",
      skipped: true,
    });
    expect(missing.status).toBe(404);
  });

  it("deletes a plan item and keeps the activities logged against it", async () => {
    const userId = "user_plan_delete";
    await call(userId, "PUT", "/v1/plan-items/p1", planBody);
    await call(userId, "PUT", "/v1/activities/a1", activityBody);
    expect(await json(await call(userId, "DELETE", "/v1/plan-items/p1"))).toEqual({
      deleted: true,
    });
    const { activities } = await json<{ activities: Activity[] }>(
      await call(userId, "GET", "/v1/activities")
    );
    expect(activities.map((a) => [a.id, a.planItemId])).toEqual([["a1", "p1"]]);
  });

  it("deletes every training row with the account", async () => {
    const userId = "user_training_purge";
    await call(userId, "PUT", "/v1/plan-items/p1", planBody);
    await call(userId, "PUT", "/v1/activities/a1", activityBody);
    await call(userId, "PUT", "/v1/workouts/w1", strengthWorkout);
    expect((await call(userId, "DELETE", "/v1/account")).status).toBe(200);
    for (const table of ["activities", "plan_items", "workouts"]) {
      const row = await env.DB.prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE user_id = ?`)
        .bind(userId)
        .first<{ n: number }>();
      expect(`${table}:${row?.n}`).toBe(`${table}:0`);
    }
  });
});

const strengthWorkout = {
  name: "Gym legs",
  category: "strength",
  description: "Heavy and slow.",
  tags: ["legs", "gym"],
  minutes: 50,
  targetRpe: 8,
  body: {
    kind: "sets",
    exercises: [{ name: "Back squat", measures: ["reps", "loadKg"], sets: [{ reps: 5 }] }],
  },
};

const climbWorkout = {
  name: "Project burns",
  category: "climb",
  description: null,
  tags: [],
  minutes: 90,
  targetRpe: 9,
  body: { kind: "climb", focus: "project", projectId: "the-roof" },
};

describe("workouts", () => {
  it("round trips each body, edits in place and lists oldest first", async () => {
    const userId = "user_workouts_roundtrip";
    const bodies = [
      strengthWorkout,
      climbWorkout,
      { ...strengthWorkout, category: "mobility", body: checklistTemplate },
      { ...strengthWorkout, category: "run", body: intervalsTemplate },
      { ...strengthWorkout, category: "other", body: null, minutes: null, targetRpe: null },
    ];
    for (const [i, body] of bodies.entries()) {
      const res = await call(userId, "PUT", `/v1/workouts/w${i}`, body);
      expect(await json<{ workout: unknown }>(res)).toMatchObject({
        workout: { id: `w${i}`, ...body },
      });
    }
    await call(userId, "PUT", "/v1/workouts/w0", { ...strengthWorkout, name: "Gym legs, heavier" });
    const { workouts } = await json<{ workouts: { id: string; name: string }[] }>(
      await call(userId, "GET", "/v1/workouts")
    );
    expect(workouts.map((w) => w.id)).toEqual(["w0", "w1", "w2", "w3", "w4"]);
    expect(workouts[0]?.name).toBe("Gym legs, heavier");
    expect(await json(await call("user_workouts_someone_else", "GET", "/v1/workouts"))).toEqual({
      workouts: [],
    });
  });

  it("rejects a body that does not fit its category", async () => {
    const userId = "user_workouts_invalid";
    for (const body of [
      { ...strengthWorkout, category: "climb" },
      { ...climbWorkout, category: "strength" },
      { ...climbWorkout, body: { kind: "climb", focus: "limit", projectId: "x" } },
      { ...strengthWorkout, category: "hang" },
      { ...strengthWorkout, tags: ["a", "a"] },
      { ...strengthWorkout, name: " " },
    ]) {
      expect((await call(userId, "PUT", "/v1/workouts/w1", body)).status).toBe(400);
    }
  });

  it("links plan items and activities to a workout, and unlinks plans when it goes", async () => {
    const userId = "user_workouts_links";
    await call(userId, "PUT", "/v1/workouts/w1", strengthWorkout);
    const linked = { ...planBody, workoutId: "w1" };
    expect(
      (await json<{ planItem: PlanItem }>(await call(userId, "PUT", "/v1/plan-items/p1", linked)))
        .planItem.workoutId
    ).toBe("w1");
    const { workoutId: _, ...older } = linked;
    const kept = await call(userId, "PUT", "/v1/plan-items/p1", { ...older, title: "Renamed" });
    expect((await json<{ planItem: PlanItem }>(kept)).planItem.workoutId).toBe("w1");
    const climb = { ...planBody, kind: "climb", workoutId: "w2", template: null };
    expect((await call(userId, "PUT", "/v1/plan-items/p2", climb)).status).toBe(200);
    const ran = { ...activityBody, workoutId: "w1" };
    const logged = await call(userId, "PUT", "/v1/activities/a1", ran);
    expect((await json<{ activity: Activity }>(logged)).activity.workoutId).toBe("w1");

    expect(await json(await call(userId, "DELETE", "/v1/workouts/w1"))).toEqual({ deleted: true });
    expect(await json(await call(userId, "DELETE", "/v1/workouts/w1"))).toEqual({ deleted: false });
    const { planItems } = await json<{ planItems: PlanItem[] }>(
      await call(userId, "GET", "/v1/plan-items")
    );
    expect(planItems.map((p) => [p.id, p.workoutId])).toEqual([
      ["p1", null],
      ["p2", "w2"],
    ]);
    const { activities } = await json<{ activities: Activity[] }>(
      await call(userId, "GET", "/v1/activities")
    );
    expect(activities.map((a) => a.workoutId)).toEqual(["w1"]);
  });
});

describe("training blocks", () => {
  const blockBody = {
    name: "Autumn finger block",
    start: "2026-09-28",
    weeks: 4,
    loads: [{ load: 100 }, { load: 110 }, { load: 120, phase: "test" }, { load: 70 }],
    notes: null,
    endedOn: null,
  };
  const scheduleBody = {
    workoutId: "rep73",
    gripId: "half",
    days: [0, 4],
    start: "2026-01-01",
    end: null,
    skip: [],
  };

  const members = async (
    userId: string
  ): Promise<{ item: PlanItem | undefined; schedule: Record<string, unknown> | undefined }> => {
    const { planItems } = await json<{ planItems: PlanItem[] }>(
      await call(userId, "GET", "/v1/plan-items")
    );
    const { schedules } = await json<{ schedules: Record<string, unknown>[] }>(
      await call(userId, "GET", "/v1/hang")
    );
    return { item: planItems[0], schedule: schedules[0] };
  };

  it("plans members on the block's dates and moves them with it", async () => {
    const userId = "user_block_dates";
    const saved = await call(userId, "PUT", "/v1/training-blocks/b1", blockBody);
    expect(await json(saved)).toEqual({ block: { id: "b1", ...blockBody } });
    await call(userId, "PUT", "/v1/plan-items/p1", { ...planBody, blockId: "b1" });
    await call(userId, "PUT", "/v1/hang/schedules/s1", {
      ...scheduleBody,
      targetRpe: 8,
      blockId: "b1",
    });
    let m = await members(userId);
    expect(m.item).toMatchObject({ start: "2026-09-28", end: "2026-10-26", blockId: "b1" });
    expect(m.schedule).toMatchObject({
      start: "2026-09-28",
      end: "2026-10-26",
      targetRpe: 8,
      blockId: "b1",
    });

    await call(userId, "PUT", "/v1/training-blocks/b1", {
      ...blockBody,
      start: "2026-10-05",
      weeks: 5,
      loads: [...blockBody.loads, { load: 70 }],
    });
    m = await members(userId);
    expect(m.item).toMatchObject({ start: "2026-10-05", end: "2026-11-09" });
    expect(m.schedule).toMatchObject({ start: "2026-10-05", end: "2026-11-09" });

    await call(userId, "PUT", "/v1/plan-items/p1", { ...planBody, targetRpe: 6 });
    expect((await members(userId)).item).toMatchObject({ blockId: "b1", targetRpe: 6 });
  });

  it("ends members with the block, and leaves them planned when it is deleted", async () => {
    const userId = "user_block_end";
    await call(userId, "PUT", "/v1/training-blocks/b1", blockBody);
    await call(userId, "PUT", "/v1/plan-items/p1", { ...planBody, blockId: "b1" });
    await call(userId, "PUT", "/v1/hang/schedules/s1", { ...scheduleBody, blockId: "b1" });
    await call(userId, "PUT", "/v1/training-blocks/b1", { ...blockBody, endedOn: "2026-10-10" });
    let m = await members(userId);
    expect(m.item).toMatchObject({ end: "2026-10-10" });
    expect(m.schedule).toMatchObject({ end: "2026-10-10" });

    const res = await call(userId, "DELETE", "/v1/training-blocks/b1");
    expect(await json(res)).toEqual({ deleted: true });
    m = await members(userId);
    expect(m.item).toMatchObject({ blockId: null, start: "2026-09-28", end: "2026-10-10" });
    expect(m.schedule).toMatchObject({ blockId: null, end: "2026-10-10" });
    const { blocks } = await json<{ blocks: unknown[] }>(
      await call(userId, "GET", "/v1/training-blocks")
    );
    expect(blocks).toEqual([]);
  });

  it("reads a block saved before loads as base-load weeks keeping their tags", async () => {
    const userId = "user_block_legacy";
    await call(userId, "PUT", "/v1/training-blocks/b1", blockBody);
    await env.DB.prepare("UPDATE training_blocks SET phases_json = ? WHERE user_id = ?")
      .bind(JSON.stringify(["build", "build", "test", "deload"]), userId)
      .run();
    const { blocks } = await json<{ blocks: { loads: unknown }[] }>(
      await call(userId, "GET", "/v1/training-blocks")
    );
    expect(blocks[0]?.loads).toEqual([
      { load: 100 },
      { load: 100 },
      { load: 100, phase: "test" },
      { load: 100, phase: "deload" },
    ]);
  });

  it("reads a week tagged build as load", async () => {
    const userId = "user_block_build";
    await call(userId, "PUT", "/v1/training-blocks/b1", blockBody);
    await env.DB.prepare("UPDATE training_blocks SET phases_json = ? WHERE user_id = ?")
      .bind(
        JSON.stringify([
          { load: 110, phase: "build" },
          { load: 100 },
          { load: 120, phase: "perform" },
          { load: 60, phase: "deload" },
        ]),
        userId
      )
      .run();
    const { blocks } = await json<{ blocks: { loads: unknown }[] }>(
      await call(userId, "GET", "/v1/training-blocks")
    );
    expect(blocks[0]?.loads).toEqual([
      { load: 110, phase: "load" },
      { load: 100 },
      { load: 120, phase: "perform" },
      { load: 60, phase: "deload" },
    ]);
  });

  it("rejects another user's block and a block out of shape", async () => {
    await call("user_block_owner", "PUT", "/v1/training-blocks/b1", blockBody);
    const userId = "user_block_other";
    for (const [path, body] of [
      ["/v1/plan-items/p1", { ...planBody, blockId: "b1" }],
      ["/v1/hang/schedules/s1", { ...scheduleBody, blockId: "b1" }],
    ] as const) {
      expect((await call(userId, "PUT", path, body)).status).toBe(400);
    }
    for (const body of [
      { ...blockBody, loads: [{ load: 100 }] },
      { ...blockBody, loads: [...blockBody.loads.slice(0, 3), { load: 100, phase: "peak" }] },
      { ...blockBody, loads: [...blockBody.loads.slice(0, 3), { load: 200 }] },
      { ...blockBody, weeks: 0, loads: [] },
      { ...blockBody, endedOn: "2026-09-28" },
      { ...blockBody, name: " " },
    ]) {
      expect((await call(userId, "PUT", "/v1/training-blocks/b2", body)).status).toBe(400);
    }
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

    await send(
      userId,
      "PUT",
      "/v1/activities/a1",
      { ...activityBody, detail: setsDetail },
      fetchImpl
    );

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
        "Back squat 5×100 kg",
        "Copenhagen plank 30s L",
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
    const checklist = {
      kind: "checklist",
      items: [
        { text: "Cat-cow", dose: "× 10", done: true },
        { text: "Deep squat hold", dose: "", done: true },
        { text: "Pigeon", dose: "1 min", done: false },
      ],
    };
    const kinds = { yoga: "Yoga", run: "Run", mobility: "Workout", other: "Workout" };
    for (const kind of Object.keys(kinds)) {
      await send(
        userId,
        "PUT",
        `/v1/activities/${kind}`,
        { ...activityBody, kind, startTime: null, rpe: null, detail: checklist },
        fetchImpl
      );
    }
    const forms = calls.map((c) => new URLSearchParams(c.body));
    expect(forms.map((f) => f.get("sport_type"))).toEqual(Object.values(kinds));
    expect(forms[0]?.get("start_date_local")).toBe("2026-10-01T12:00:00Z");
    expect(forms[0]?.get("description")).toBe(
      ["created by https://sendtally.com", "✓ Cat-cow × 10", "✓ Deep squat hold"].join("\n")
    );
  });

  it("describes an intervals run by each step's dose and the turns done", async () => {
    const userId = "user_activity_intervals_strava";
    await connectStrava(userId, true);
    const { fetchImpl, calls } = stravaRoutes();
    const detail = {
      ...intervalsTemplate,
      stepsDone: [
        { round: 0, step: 0, side: "L" },
        { round: 0, step: 0, side: "R", heldSeconds: 20 },
        { round: 0, step: 1 },
      ],
    };
    await send(
      userId,
      "PUT",
      "/v1/activities/a1",
      { ...activityBody, kind: "mobility", rpe: null, detail },
      fetchImpl
    );
    expect(new URLSearchParams(calls[0]?.body).get("description")).toBe(
      [
        "created by https://sendtally.com",
        "Couch stretch 45s each 2/4",
        "Swing 15× 24 kg 1/2",
      ].join("\n")
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
