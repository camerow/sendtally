import { env } from "cloudflare:test";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { Env } from "../src/bindings";
import type * as harness from "./harness";
import type * as posthog from "../src/lib/posthog";

const captureUserEvent = vi.hoisted(() => vi.fn(async () => undefined));
vi.mock("../src/lib/posthog", async (importOriginal) => ({
  ...(await importOriginal<typeof posthog>()),
  captureUserEvent,
}));

// The pool loads the Worker's modules before this file's mock exists, so the app
// is imported afresh for the mock to reach the capture helper.
let testApp: typeof harness.testApp;
beforeAll(async () => {
  vi.resetModules();
  ({ testApp } = await import("./harness"));
});

type ToolResult = { isError?: boolean; content: Array<{ text: string }> };

const rpc = async (
  method: string,
  params: unknown,
  user?: string,
  bindings: Env = env
): Promise<Response> =>
  testApp().request(
    "https://api.sendtally.test/mcp",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
        ...(user === undefined ? {} : { "x-test-user": user }),
      },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    },
    bindings
  );

const callTool = async (
  user: string,
  bindings: Env = env,
  name = "list_sessions",
  args: Record<string, unknown> = {}
): Promise<ToolResult> => {
  const res = await rpc("tools/call", { name, arguments: args }, user, bindings);
  return ((await res.json()) as { result: ToolResult }).result;
};

const toolJson = async <T>(
  user: string,
  name: string,
  args: Record<string, unknown> = {}
): Promise<T> => JSON.parse((await callTool(user, env, name, args)).content[0]?.text ?? "{}") as T;

const put = async (user: string, path: string, body: unknown): Promise<void> => {
  const res = await testApp().request(
    path,
    {
      method: path === "/v1/sessions" || path === "/v1/gyms" ? "POST" : "PUT",
      headers: { "x-test-user": user, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    env
  );
  expect(res.ok).toBe(true);
};

const recently = (daysAgo: number): string =>
  new Date(Date.now() - daysAgo * 86_400_000).toISOString().slice(0, 10);

const session = (date: string, climbs: unknown[]): unknown => ({
  date,
  name: "Tuesday night session",
  startTime: "18:00",
  endTime: "19:30",
  location: "indoor",
  climbs,
});

describe("connector", () => {
  beforeEach(() => captureUserEvent.mockClear());

  it("sends an unsigned client to the Clerk instance that signs it in", async () => {
    const res = await rpc("tools/list", {});
    expect(res.status).toBe(401);
    const challenge = res.headers.get("WWW-Authenticate") ?? "";
    const metadataUrl = /resource_metadata="([^"]+)"/.exec(challenge)?.[1] ?? "";
    expect(metadataUrl).toBe("https://api.sendtally.test/.well-known/oauth-protected-resource/mcp");
    expect(challenge).toContain('scope="profile offline_access"');

    const metadata = await testApp().request(metadataUrl, {}, env);
    expect(await metadata.json()).toMatchObject({
      resource: "https://api.sendtally.test/mcp",
      authorization_servers: ["https://clerk.sendtally.test"],
      scopes_supported: ["profile", "offline_access"],
    });
  });

  it("lists only the signed-in user's sessions", async () => {
    await testApp().request(
      "/v1/sessions",
      {
        method: "POST",
        headers: { "x-test-user": "user_mcp", "Content-Type": "application/json" },
        body: JSON.stringify({
          date: "2026-11-01",
          name: "Tuesday night session",
          startTime: "18:00",
          endTime: "19:30",
          location: "indoor",
          climbs: [{ name: "", grade: { scale: "v", value: 4 }, kind: "send", tries: 1 }],
        }),
      },
      env
    );
    const sessionsOf = async (user: string): Promise<unknown[]> => {
      const result = await callTool(user);
      return (JSON.parse(result.content[0]?.text ?? "{}") as { sessions: unknown[] }).sessions;
    };
    expect(await sessionsOf("user_mcp")).toMatchObject([{ topGrade: "V4" }]);
    expect(await sessionsOf("user_other")).toEqual([]);
  });

  it("records each tool call against the user and the assistant that made it", async () => {
    await callTool("user_mcp");
    expect(captureUserEvent).toHaveBeenCalledWith(
      expect.anything(),
      "user_mcp",
      "connector_tool_called",
      { tool: "list_sessions", client: "test-client" }
    );
  });

  it("turns away a user over the rate limit without running the tool", async () => {
    const limited: Env = {
      ...env,
      CONNECTOR_RATE_LIMITER: { limit: async () => ({ success: false }) },
    };
    const result = await callTool("user_mcp", limited);
    expect(result).toMatchObject({
      isError: true,
      content: [{ text: expect.stringMatching(/Wait a minute/) }],
    });
    expect(captureUserEvent).not.toHaveBeenCalled();
  });

  it("lists sessions in a date range, with their climbs when asked", async () => {
    const user = "user_range";
    await put(
      user,
      "/v1/sessions",
      session("2026-10-01", [
        { name: "Crimp line", grade: { scale: "v", value: 3 }, kind: "send", tries: 2 },
      ])
    );
    await put(
      user,
      "/v1/sessions",
      session("2026-10-20", [
        { name: "", grade: { scale: "v", value: 5 }, kind: "attempt", tries: 4 },
      ])
    );
    type Listed = { sessions: Array<{ startAt: string; climbs?: unknown[] }> };
    const ranged = await toolJson<Listed>(user, "list_sessions", {
      from: "2026-10-01",
      to: "2026-10-01",
      includeClimbs: true,
    });
    expect(ranged.sessions).toHaveLength(1);
    expect(ranged.sessions[0]?.climbs).toEqual([
      { name: "Crimp line", grade: "V3", kind: "send", tries: 2 },
    ]);
    const plain = await toolJson<Listed>(user, "list_sessions");
    expect(plain.sessions).toHaveLength(2);
    expect(plain.sessions[0]).not.toHaveProperty("climbs");
    expect(plain.sessions[0]).not.toHaveProperty("id");
  });

  it("summarises only the signed-in user's recent climbing", async () => {
    const user = "user_summary";
    await put(
      user,
      "/v1/sessions",
      session(recently(3), [
        { name: "", grade: { scale: "v", value: 4 }, kind: "send", tries: 1 },
        { name: "", grade: { scale: "v", value: 4 }, kind: "send", tries: 1 },
        { name: "", grade: { scale: "v", value: 6 }, kind: "attempt", tries: 3 },
        { name: "", grade: { scale: "french", value: "7a" }, kind: "send", tries: 1 },
      ])
    );
    await put(
      user,
      "/v1/sessions",
      session("2020-01-01", [{ name: "", grade: { scale: "v", value: 9 }, kind: "send", tries: 1 }])
    );
    const summary = await toolJson<Record<string, unknown>>(user, "get_climbing_summary", {
      weeks: 4,
    });
    expect(summary).toMatchObject({
      sessions: 1,
      sessionsPerWeek: 0.3,
      rpeByWeek: [{ sessions: 1 }],
      disciplines: expect.arrayContaining([
        {
          discipline: "boulder",
          hardestSend: "V4",
          hardestTried: "V6",
          sendPyramid: [{ grade: "V4", sends: 2 }],
        },
        {
          discipline: "route",
          hardestSend: "7a",
          hardestTried: "7a",
          sendPyramid: [{ grade: "7a", sends: 1 }],
        },
      ]),
    });
    expect(await toolJson(user + "_other", "get_climbing_summary")).toMatchObject({
      sessions: 0,
      disciplines: [],
    });
  });

  it("reads only the signed-in user's library and plan", async () => {
    const user = "user_library";
    await put(user, "/v1/workouts/w1", {
      kind: "strength",
      name: "Back squat",
      description: "",
      minutes: 45,
      targetRpe: 8,
      items: [{ exercise: "Back squat", doses: [{ sets: 5, reps: 5, weightKg: 100 }] }],
    });
    await put(user, "/v1/blocks/b1", {
      name: "Winter base",
      start: "2026-11-02",
      weeks: 6,
      focus: null,
    });
    await put(user, "/v1/memberships/m1", {
      workoutId: "w1",
      blockId: "b1",
      weekdays: [1, 4],
      start: "2026-11-02",
      position: 0,
    });

    expect(await toolJson(user, "get_training_library")).toMatchObject({
      exercises: [{ name: "Back squat", kind: "strength" }],
      workouts: [
        {
          name: "Back squat",
          targetRpe: 8,
          items: [{ exercise: "Back squat", doses: [{ sets: 5, reps: 5, weightKg: 100 }] }],
        },
      ],
      hangboardGrips: expect.arrayContaining([{ id: "half", name: "Half crimp" }]),
    });
    expect(await toolJson(user, "get_plan")).toEqual({
      blocks: [
        {
          name: "Winter base",
          start: "2026-11-02",
          weeks: 6,
          workouts: [
            {
              workout: "Back squat",
              start: "2026-11-02",
              weekdays: [1, 4],
              weekdaysFromWeek: [],
              weekChanges: [],
              skippedOrMoved: [],
            },
          ],
        },
      ],
      outsideBlocks: [],
    });

    const other = user + "_other";
    expect(await toolJson(other, "get_training_library")).toMatchObject({
      exercises: [],
      workouts: [],
    });
    expect(await toolJson(other, "get_plan")).toEqual({ blocks: [], outsideBlocks: [] });
  });

  const CSV = [
    "date,session,location,gym,climb,grade,kind,tries,climb_notes",
    "2026-09-01,Tuesday night session,indoor,,Crimp line,V4,send,2,Felt strong",
    ",,,,,V5,attempt,3,",
    "2026-09-03,Thursday session,indoor,,,V6,send,1,",
    "2026-09-03,Thursday session,indoor,,,V99,send,1,",
  ].join("\n");

  const importLog = (user: string, args: Record<string, unknown>) =>
    toolJson<Record<string, unknown>>(user, "import_climbing_log", {
      timeZone: "UTC",
      ...args,
    });

  it("checks a log on a dry run and writes nothing", async () => {
    const user = "user_import_dry";
    expect(await importLog(user, { csv: CSV, dryRun: true })).toEqual({
      format: "sendtally",
      sessions: 2,
      climbs: 3,
      issues: [{ row: 5, code: "unknownGrade", value: "V99", climb: "" }],
    });
    expect(await toolJson(user, "list_sessions")).toEqual({ sessions: [] });
  });

  it("imports a log once and reports each bad row by its number", async () => {
    const user = "user_import";
    const issues = [{ row: 5, code: "unknownGrade", value: "V99", climb: "" }];
    expect(await importLog(user, { csv: CSV })).toEqual({
      format: "sendtally",
      imported: 2,
      skipped: 0,
      issues,
    });
    expect(await importLog(user, { csv: CSV })).toEqual({
      format: "sendtally",
      imported: 0,
      skipped: 2,
      issues,
    });
    type Listed = { sessions: Array<{ title: string; climbs: unknown[] }> };
    const listed = await toolJson<Listed>(user, "list_sessions", { includeClimbs: true });
    expect(listed.sessions.map((s) => s.climbs.length)).toEqual([1, 2]);
    expect(await toolJson(user + "_other", "list_sessions")).toEqual({ sessions: [] });
  });

  it("reports a session the log form would refuse against its first row", async () => {
    const csv = [
      "date,start_time,end_time,grade",
      "2026-09-01,06:00,20:00,V4",
      "2026-09-02,,,V5",
    ].join("\n");
    expect(await importLog("user_import_long", { csv })).toMatchObject({
      imported: 1,
      issues: [{ row: 2, code: "invalidSession", value: expect.stringMatching(/too long/) }],
    });
  });

  it("logs a session for the signed-in user only, matching their gym by name", async () => {
    const user = "user_log";
    await put(user, "/v1/gyms", { id: "g1", name: "Boulder Barn" });
    const logged = await toolJson<Record<string, unknown>>(user, "log_session", {
      date: "2026-09-05",
      startTime: "18:00",
      endTime: "19:30",
      gym: "boulder barn",
      climbs: [{ name: "Arete", grade: { scale: "v", value: 5 }, kind: "send", tries: 2 }],
    });
    expect(logged).toMatchObject({ startAt: "2026-09-05T18:00:00.000Z", rpe: expect.any(Number) });
    const row = await env.DB.prepare("SELECT gym_id FROM sessions WHERE user_id = ?")
      .bind(user)
      .first<{ gym_id: string }>();
    expect(row?.gym_id).toBe("g1");
    expect(await toolJson(user + "_other", "list_sessions")).toEqual({ sessions: [] });
  });

  it("refuses a session the log form would refuse", async () => {
    const result = await toolJson<Record<string, unknown>>("user_log_bad", "log_session", {
      date: "2026-09-05",
      startTime: "06:00",
      endTime: "20:00",
      climbs: [{ grade: { scale: "v", value: 5 } }],
    });
    expect(result.error).toMatch(/too long/);
    expect(await toolJson("user_log_bad", "list_sessions")).toEqual({ sessions: [] });
  });
});
