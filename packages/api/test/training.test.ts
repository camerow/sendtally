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
    expect(planItems).toEqual([{ id: "p1", ...planBody, skip: ["2026-09-29", "2026-10-01"] }]);
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
    expect(await json(saved)).toEqual({ planItem: { id: "p1", ...withTemplate } });
    const skipped = await call(userId, "PUT", "/v1/plan-items/p1/skip", {
      date: "2026-09-29",
      skipped: true,
    });
    expect((await json<{ planItem: PlanItem }>(skipped)).planItem.template).toEqual(
      checklistTemplate
    );
    const intervals = { ...planBody, kind: "mobility", template: intervalsTemplate };
    const timed = await call(userId, "PUT", "/v1/plan-items/p3", intervals);
    expect(await json(timed)).toEqual({ planItem: { id: "p3", ...intervals } });
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
