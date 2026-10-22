import { env } from "cloudflare:test";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Activity, PlanItem } from "../src/lib/activities";
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
      activity: { id: "a1", ...activityBody, rpe: 8 },
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

  it("round trips a sets or checklist body", async () => {
    const userId = "user_activity_detail";
    const checklist = {
      kind: "checklist",
      items: [{ text: "Cat-cow", dose: "× 10", done: true }],
    };
    for (const detail of [setsDetail, checklist]) {
      const res = await call(userId, "PUT", "/v1/activities/a1", { ...activityBody, detail });
      expect(await json(res)).toEqual({ activity: { id: "a1", ...activityBody, detail } });
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
      { id: "p1", ...planBody, skip: ["2026-09-29", "2026-10-01"], blockId: null },
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
    expect(await json(saved)).toEqual({ planItem: { id: "p1", ...withTemplate, blockId: null } });
    const skipped = await call(userId, "PUT", "/v1/plan-items/p1/skip", {
      date: "2026-09-29",
      skipped: true,
    });
    expect((await json<{ planItem: PlanItem }>(skipped)).planItem.template).toEqual(
      checklistTemplate
    );
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
    expect((await call(userId, "DELETE", "/v1/account")).status).toBe(200);
    for (const table of ["activities", "plan_items"]) {
      const row = await env.DB.prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE user_id = ?`)
        .bind(userId)
        .first<{ n: number }>();
      expect(`${table}:${row?.n}`).toBe(`${table}:0`);
    }
  });
});

describe("training blocks", () => {
  const blockBody = {
    name: "Autumn finger block",
    start: "2026-09-28",
    weeks: 4,
    phases: ["build", "build", "build", "deload"],
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
      phases: [...blockBody.phases, "test"],
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
      { ...blockBody, phases: ["build"] },
      { ...blockBody, phases: ["build", "build", "build", "peak"] },
      { ...blockBody, weeks: 0, phases: [] },
      { ...blockBody, endedOn: "2026-09-28" },
      { ...blockBody, name: " " },
    ]) {
      expect((await call(userId, "PUT", "/v1/training-blocks/b2", body)).status).toBe(400);
    }
  });
});
