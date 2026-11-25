import { env } from "cloudflare:test";
import { afterEach, describe, expect, it, vi } from "vitest";
import { INSIGHTS_FEATURE } from "../src/features";
import { testApp, type AuthOverrides } from "./harness";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const IN_TRIAL = "2026-11-20T00:00:00Z";
const AFTER_TRIAL = "2027-01-01T00:00:00Z";

type Account = { userId: string; signedUp: string; features: string; connector: AuthOverrides };

const lapsed = (userId: string): Account => ({
  userId,
  signedUp: IN_TRIAL,
  features: "",
  connector: {},
});
const member = (userId: string): Account => ({
  ...lapsed(userId),
  features: INSIGHTS_FEATURE,
  connector: { webFeature: async () => true },
});
const trial = (userId: string): Account => ({
  ...lapsed(userId),
  signedUp: "2026-12-28T00:00:00Z",
});

const call = async (
  account: Account,
  method: string,
  path: string,
  body?: unknown
): Promise<Response> =>
  testApp().request(
    path,
    {
      method,
      headers: {
        "x-test-user": account.userId,
        "x-test-features": account.features,
        "Content-Type": "application/json",
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    },
    env
  );

const workout = (name: string, exercises: string[]): unknown => ({
  kind: "strength",
  name,
  description: "",
  minutes: 45,
  targetRpe: 8,
  items: exercises.map((exercise) => ({ exercise, doses: [{ sets: 3, reps: 8 }] })),
  exerciseRestS: 120,
});

const block = { name: "Winter base", description: "", start: "2026-11-23", weeks: 4, focus: null };

const membership = (workoutId: string, blockId: string | null): unknown => ({
  workoutId,
  blockId,
  weekdays: [1],
  start: "2026-11-23",
  position: 0,
});

const activity = {
  kind: "strength",
  title: "Pull day",
  date: "2026-12-31",
  startTime: "18:30",
  minutes: 50,
  rpe: 7,
  notes: null,
  workoutId: "w_own",
  membershipId: null,
  week: null,
  focus: null,
  done: [],
};

const session = {
  date: "2026-12-31",
  name: "Tuesday night session",
  startTime: "18:00",
  endTime: "19:30",
  location: "indoor",
  climbs: [{ name: "Arete", grade: { scale: "v", value: 4 }, kind: "send", tries: 2 }],
};

type Step = [method: string, path: string, body?: unknown];

const setup: Step[] = [
  ["PUT", "/v1/workouts/w_own", workout("Pull day", ["Pull-up", "Dips"])],
  ["PUT", "/v1/blocks/b1", block],
  ["PUT", "/v1/memberships/m_block", membership("w_own", "b1")],
  ["PUT", "/v1/exercises/e_own", { name: "Hip openers", kind: "mobility" }],
  ["PUT", "/v1/exercises/e_other", { name: "Wall slides", kind: "mobility" }],
];

const gated: Step[] = [
  ["PUT", "/v1/workouts/w_new", workout("Push day", ["Dips", "Push-up"])],
  ["PUT", "/v1/workouts/w_own", workout("Pull day", ["Pull-up"])],
  ["PUT", "/v1/exercises/e_new", { name: "Hip circles", kind: "mobility" }],
  ["PUT", "/v1/exercises/e_own", { name: "Hip openers", kind: "mobility", eachSide: true }],
  ["PUT", "/v1/hang/grips/g_new", { name: "Pinch block" }],
  ["PUT", "/v1/blocks/b_new", block],
  ["PUT", "/v1/blocks/b1", { ...block, weeks: 6 }],
  ["POST", "/v1/blocks/b1/copy", { id: "b_copy", start: null }],
  ["PUT", "/v1/memberships/m_new", membership("max10", "b1")],
  ["PUT", "/v1/memberships/m_solo", membership("w_own", null)],
  ["PUT", "/v1/memberships/m_block/days/2026-11-24", { kind: "skip" }],
  ["PUT", "/v1/memberships/m_block/schedule", { weekdays: [2], weeks: [] }],
  ["PUT", "/v1/memberships/m_block/changes", { week: 1, dose: 0, item: 0, change: { sets: 4 } }],
  ["DELETE", "/v1/memberships/m_block/days/2026-11-24"],
  ["DELETE", "/v1/memberships/m_block"],
  ["POST", "/v1/exercises/e_own/merge", { into: "e_other" }],
];

const open: Step[] = [
  ["GET", "/v1/plan"],
  ["GET", "/v1/workouts"],
  ["GET", "/v1/exercises"],
  ["PUT", "/v1/activities/a1", activity],
  ["POST", "/v1/sessions", session],
  ["PUT", "/v1/memberships/m_builtin", membership("max10", null)],
  ["PUT", "/v1/exercises/e_linked", { name: "Back squat", kind: "strength", builtIn: "squat" }],
  ["PUT", "/v1/workouts/w_wrap", workout("Back squat", ["Back squat"])],
  ["PUT", "/v1/memberships/m_wrap", membership("w_wrap", null)],
  ["PUT", "/v1/hang/grips/half", { name: "Half crimp", measure: "hang" }],
  ["DELETE", "/v1/workouts/w_own"],
  ["DELETE", "/v1/blocks/b1"],
  ["DELETE", "/v1/exercises/e_own"],
];

async function madeInTrial(account: Account): Promise<void> {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(IN_TRIAL);
  await env.DB.prepare("INSERT INTO users (id, created_at) VALUES (?, ?)")
    .bind(account.userId, account.signedUp)
    .run();
  for (const [method, path, body] of setup) {
    expect((await call(account, method, path, body)).status, path).toBe(200);
  }
  vi.setSystemTime(AFTER_TRIAL);
}

describe("membership locks", () => {
  it("refuses a free account past its trial every way of making or changing its own training", async () => {
    const account = lapsed("user_locks_lapsed");
    await madeInTrial(account);
    for (const [method, path, body] of gated) {
      const res = await call(account, method, path, body);
      expect(res.status, `${method} ${path}`).toBe(403);
      expect(await res.json()).toMatchObject({ code: "members_only" });
    }
  });

  it.each([
    ["a member", member("user_locks_member")],
    ["an account inside its trial", trial("user_locks_trial")],
  ])("lets %s make and change all of it", async (_, account) => {
    await madeInTrial(account);
    for (const [method, path, body] of gated) {
      expect((await call(account, method, path, body)).status, `${method} ${path}`).toBe(200);
    }
  });

  it("keeps reads, logging, built-ins on their own day and deleting open past the trial", async () => {
    const account = lapsed("user_locks_open");
    await madeInTrial(account);
    for (const [method, path, body] of open) {
      expect((await call(account, method, path, body)).ok, `${method} ${path}`).toBe(true);
    }
  });

  it("gives every account at least 14 days from the locks' release", async () => {
    const account = { ...lapsed("user_locks_floor"), signedUp: "2026-01-01T00:00:00Z" };
    await madeInTrial(account);
    vi.setSystemTime("2026-12-09T00:00:00Z");
    expect((await call(account, "PUT", "/v1/blocks/b_floor", block)).status).toBe(200);
    vi.setSystemTime("2026-12-11T00:00:00Z");
    expect((await call(account, "PUT", "/v1/blocks/b_late", block)).status).toBe(403);
  });
});

type ToolResult = { isError?: boolean; content: Array<{ text: string }> };

async function tool(
  account: Account,
  name: string,
  args: Record<string, unknown>
): Promise<ToolResult> {
  const res = await testApp(undefined, account.connector).request(
    "https://api.sendtally.test/mcp",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
        "x-test-user": account.userId,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: { name, arguments: args },
      }),
    },
    env
  );
  return ((await res.json()) as { result: ToolResult }).result;
}

const saves: [string, Record<string, unknown>][] = [
  [
    "save_workout",
    {
      name: "Push day",
      description: "",
      minutes: null,
      targetRpe: null,
      items: [
        { exercise: "Dips", doses: [{ sets: 3, reps: 8 }] },
        { exercise: "Push-up", doses: [{ sets: 3, reps: 12 }] },
      ],
    },
  ],
  ["save_exercise", { name: "Hip circles", kind: "mobility" }],
  ["save_block", { block, workouts: [{ workout: "Pull day", weekdays: [0] }] }],
];

describe("membership locks through the connector", () => {
  it("refuses a free account past its trial with words an assistant can pass on", async () => {
    const account = lapsed("user_locks_connector_lapsed");
    await madeInTrial(account);
    for (const [name, args] of saves) {
      const result = await tool(account, name, args);
      expect(result.isError, name).toBe(true);
      expect(result.content[0]?.text).toMatch(/need a sendtally membership/);
    }
  });

  it.each([
    ["a web member", member("user_locks_connector_member")],
    ["an account inside its trial", trial("user_locks_connector_trial")],
  ])("saves for %s", async (_, account) => {
    await madeInTrial(account);
    for (const [name, args] of saves) {
      expect((await tool(account, name, args)).isError, name).toBeUndefined();
    }
  });
});
