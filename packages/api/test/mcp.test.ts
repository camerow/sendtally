import { createExecutionContext, env, waitOnExecutionContext } from "cloudflare:test";
import { PostHog } from "posthog-node";
import { describe, expect, it, vi } from "vitest";
import type { Env } from "../src/bindings";
import * as posthog from "../src/lib/posthog";
import { testApp } from "./harness";

type ToolResult = { isError?: boolean; content: Array<{ text: string }> };

const rpc = async (
  method: string,
  params: unknown,
  user?: string,
  bindings: Env = env
): Promise<Response> => {
  const ctx = createExecutionContext();
  const res = await testApp().request(
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
    bindings,
    ctx
  );
  await waitOnExecutionContext(ctx);
  return res;
};

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

  it("records each tool call against the user, without the logbook", async () => {
    await put(
      "user_mcp",
      "/v1/sessions",
      session("2026-10-01", [
        { name: "Crimp line", grade: { scale: "v", value: 3 }, kind: "send", tries: 2 },
      ])
    );
    const client = new PostHog("phc_test", {
      host: "https://us.i.posthog.com",
      fetch: async () => new Response("{}"),
    });
    const capture = vi.spyOn(client, "capture");
    const spy = vi.spyOn(posthog, "getPostHog").mockReturnValue(client);
    try {
      await callTool("user_mcp", env, "list_sessions", { from: "2026-10-01", includeClimbs: true });
      await callTool("user_mcp", env, "delete_block", { id: "winter-base-2026" });
    } finally {
      spy.mockRestore();
    }

    const toolCall = capture.mock.calls.find(([e]) => e.event === "$mcp_tool_call")?.[0];
    expect(toolCall).toMatchObject({
      distinctId: "user_mcp",
      properties: { $mcp_tool_name: "list_sessions", $mcp_is_error: false },
    });
    const sent = JSON.stringify(capture.mock.calls);
    expect(sent).not.toContain("Crimp line");
    expect(sent).not.toContain("2026-10-01");
    expect(sent).not.toContain("winter-base-2026");
    expect(toolCall?.properties).not.toHaveProperty("$mcp_parameters");
    expect(toolCall?.properties).not.toHaveProperty("$mcp_response");
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
    type Listed = { sessions: Array<{ id: string; startAt: string; climbs?: unknown[] }> };
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
    expect(plain.sessions[0]?.id).toMatch(/^manual-/);
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

    type Library = { exercises: Array<{ name: string; builtIn?: boolean }>; workouts: unknown[] };
    const library = await toolJson<Library>(user, "get_training_library");
    expect(library).toMatchObject({
      exercises: expect.arrayContaining([
        {
          id: expect.any(String),
          name: "Back squat",
          kind: "strength",
          measure: "repsWeight",
          eachSide: false,
        },
        {
          id: "pullUps",
          name: "Pull-ups",
          kind: "strength",
          measure: "repsWeight",
          eachSide: false,
          builtIn: true,
        },
      ]),
      workouts: expect.arrayContaining([
        {
          id: "w1",
          name: "Back squat",
          kind: "strength",
          focus: null,
          minutes: 45,
          targetRpe: 8,
          items: [{ exercise: "Back squat", doses: [{ sets: 5, reps: 5, weightKg: 100 }] }],
        },
        expect.objectContaining({
          id: "rep73",
          name: "Repeaters 7:3",
          builtIn: true,
          items: [
            { exercise: "half", doses: [{ sets: 6, reps: 6, onS: 7, offS: 3, setRestS: 180 }] },
          ],
        }),
      ]),
      hangboardGrips: expect.arrayContaining([{ id: "half", name: "Half crimp" }]),
    });
    expect(library.exercises.filter((e) => e.name === "Back squat")).toHaveLength(1);
    expect(await toolJson(user, "get_plan")).toEqual({
      blocks: [
        {
          id: "b1",
          name: "Winter base",
          start: "2026-11-02",
          weeks: 6,
          workouts: [
            {
              id: "m1",
              workoutId: "w1",
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
    const others = await toolJson<Library>(other, "get_training_library");
    expect(others.exercises.every((e) => e.builtIn)).toBe(true);
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

  describe("training tools", () => {
    type Saved = { exercise: { name: string; builtIn: boolean }; existing: boolean };
    type Library = { exercises: Array<{ name: string; kind: string; builtIn?: boolean }> };
    type PlanOut = { blocks: Array<{ name: string; workouts: Array<Record<string, unknown>> }> };
    const mine = async (user: string): Promise<Library["exercises"]> =>
      (await toolJson<Library>(user, "get_training_library")).exercises.filter((e) => !e.builtIn);

    it("saves an exercise once, links a built-in by name and answers a clash with the existing one", async () => {
      const user = "user_save_exercise";
      const fingerboard = { name: "Weighted pinch", kind: "strength", measure: "secondsWeight" };
      expect(
        await toolJson<Saved>(user, "save_exercise", { key: "pinch", ...fingerboard })
      ).toEqual({
        exercise: { id: "pinch", ...fingerboard, eachSide: false, builtIn: false },
        existing: false,
      });
      expect(
        await toolJson<Saved>(user, "save_exercise", { key: "pinch", ...fingerboard })
      ).toMatchObject({
        existing: false,
      });
      expect(
        await toolJson<Saved>(user, "save_exercise", { name: "weighted PINCH", kind: "other" })
      ).toMatchObject({ exercise: { name: "Weighted pinch", kind: "strength" }, existing: true });
      expect(
        await toolJson<Saved>(user, "save_exercise", { name: "pull-ups", kind: "other" })
      ).toEqual({
        exercise: {
          id: expect.any(String),
          name: "Pull-ups",
          kind: "strength",
          measure: "repsWeight",
          eachSide: false,
          builtIn: true,
        },
        existing: false,
      });
      expect((await mine(user)).map((e) => e.name).sort()).toEqual(["Pull-ups", "Weighted pinch"]);
      expect(await mine(user + "_other")).toEqual([]);
    });

    it("saves a workout whose items reuse the user's exercises, then built-ins, then new ones", async () => {
      const user = "user_save_workout";
      await toolJson(user, "save_exercise", { name: "Pinch block", kind: "strength" });
      const workout = {
        key: "pull-day",
        kind: "strength",
        name: "Pull day",
        description: "",
        minutes: 40,
        targetRpe: 7,
        items: [
          { exercise: "pinch BLOCK", doses: [{ sets: 3, onS: 10, weightKg: 20 }] },
          { exercise: "chin-ups", doses: [{ sets: 4, reps: 6 }] },
          { exercise: "Towel hangs", doses: [{ sets: 3, onS: 20 }] },
        ],
      };
      const saved = await toolJson<{ workout: { items: Array<{ exercise: string }> } }>(
        user,
        "save_workout",
        workout
      );
      expect(saved.workout.items.map((i) => i.exercise)).toEqual([
        "Pinch block",
        "Chin-ups",
        "Towel hangs",
      ]);
      await toolJson(user, "save_workout", workout);
      const library = await toolJson<{ workouts: Array<{ name: string; builtIn?: boolean }> }>(
        user,
        "get_training_library"
      );
      expect(library.workouts.filter((w) => !w.builtIn).map((w) => w.name)).toEqual(["Pull day"]);
      expect(await mine(user)).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: "Chin-ups", kind: "strength" }),
          expect.objectContaining({ name: "Towel hangs", kind: "strength" }),
        ])
      );
      expect(await mine(user)).toHaveLength(3);
      expect(await mine(user + "_other")).toEqual([]);
    });

    it("explains which field is out of range", async () => {
      const result = await callTool("user_save_invalid", env, "save_workout", {
        kind: "strength",
        name: "Too much",
        description: "",
        minutes: null,
        targetRpe: 11,
        items: [{ exercise: "Dips", doses: [{ sets: 0 }] }],
      });
      expect(result.isError).toBe(true);
      expect(result.content[0]?.text).toContain("<=10 at targetRpe");
      expect(result.content[0]?.text).toContain(
        "expected number to be >=1 at items[0].doses[0].sets"
      );
    });

    it("plans a block with its workouts and weekdays in one call, once per key", async () => {
      const user = "user_save_block";
      await toolJson(user, "save_workout", {
        kind: "strength",
        name: "Pull day",
        description: "",
        minutes: null,
        targetRpe: null,
        items: [{ exercise: "Pull-ups", doses: [{ sets: 4, reps: 6 }] }],
      });
      const block = {
        key: "winter",
        block: { name: "Winter base", start: "2026-11-02", weeks: 6 },
        workouts: [
          { workout: "pull day", weekdays: [0, 3] },
          { workout: "Max hangs", weekdays: [1], weeks: [{ fromWeek: 4, weekdays: [1, 5] }] },
        ],
      };
      await toolJson(user, "save_block", block);
      await toolJson(user, "save_block", block);
      expect(await toolJson<PlanOut>(user, "get_plan")).toMatchObject({
        blocks: [
          {
            name: "Winter base",
            start: "2026-11-02",
            weeks: 6,
            workouts: [
              { workout: "Pull day", start: "2026-11-02", weekdays: [0, 3], weekdaysFromWeek: [] },
              {
                workout: "max10",
                weekdays: [1],
                weekdaysFromWeek: [{ fromWeek: 4, weekdays: [1, 5] }],
              },
            ],
          },
        ],
      });
      expect(await toolJson(user + "_other", "get_plan")).toEqual({
        blocks: [],
        outsideBlocks: [],
      });
    });

    it("saves nothing when a block names a workout the user does not have", async () => {
      const user = "user_save_block_unknown";
      const result = await callTool(user, env, "save_block", {
        block: { name: "Spring", start: "2026-03-02", weeks: 4 },
        workouts: [
          { workout: "Max hangs", weekdays: [0] },
          { workout: "Mystery", weekdays: [2] },
        ],
      });
      expect(result).toMatchObject({
        isError: true,
        content: [{ text: expect.stringMatching(/Mystery/) }],
      });
      expect(await toolJson(user, "get_plan")).toEqual({ blocks: [], outsideBlocks: [] });
    });

    const errorOf = async (user: string, name: string, args: Record<string, unknown>) => {
      const result = await callTool(user, env, name, args);
      expect(result.isError).toBe(true);
      return result.content[0]?.text ?? "";
    };

    const pullDay = {
      kind: "strength",
      name: "Pull day",
      description: "",
      minutes: 40,
      targetRpe: 7,
      items: [{ exercise: "Pull-ups", doses: [{ sets: 4, reps: 6 }] }],
    };

    type SavedWorkout = { workout: { id: string; minutes: number } };
    type SavedBlock = { block: { id: string; start: string | null } };
    type Plan = {
      blocks: Array<{ id: string; start: string | null; workouts: Array<Record<string, unknown>> }>;
    };

    it("edits an exercise, a workout and a block in place, keeping their ids", async () => {
      const user = "user_edit";
      const made = await toolJson<{ exercise: { id: string } }>(user, "save_exercise", {
        name: "Pinch block",
        kind: "strength",
      });
      const edited = await toolJson<{ exercise: { id: string; name: string } }>(
        user,
        "save_exercise",
        { id: made.exercise.id, name: "Pinch lifts", kind: "strength" }
      );
      expect(edited.exercise).toMatchObject({ id: made.exercise.id, name: "Pinch lifts" });
      expect((await mine(user)).map((e) => e.name)).not.toContain("Pinch block");

      const workout = await toolJson<SavedWorkout>(user, "save_workout", pullDay);
      const rewritten = await toolJson<SavedWorkout>(user, "save_workout", {
        ...pullDay,
        id: workout.workout.id,
        minutes: 60,
      });
      expect(rewritten.workout).toMatchObject({ id: workout.workout.id, minutes: 60 });

      const block = await toolJson<SavedBlock>(user, "save_block", {
        block: { name: "Winter base", start: "2026-11-02", weeks: 6 },
        workouts: [
          { workout: "Pull day", weekdays: [0] },
          { workout: "Max hangs", weekdays: [2] },
        ],
      });
      const before = (await toolJson<Plan>(user, "get_plan")).blocks[0]?.workouts[0]?.id;
      await toolJson(user, "save_block", {
        id: block.block.id,
        block: { name: "Winter base", start: "2026-11-02", weeks: 8 },
        workouts: [{ workout: "Pull day", weekdays: [0, 3] }],
      });
      const plan = await toolJson<Plan>(user, "get_plan");
      expect(plan.blocks).toMatchObject([
        {
          id: block.block.id,
          weeks: 8,
          workouts: [{ id: before, workout: "Pull day", weekdays: [0, 3] }],
        },
      ]);
      expect(
        await errorOf(user + "_other", "save_block", {
          id: block.block.id,
          block: { name: "Mine now", start: null, weeks: 4 },
          workouts: [{ workout: "Max hangs", weekdays: [0] }],
        })
      ).toMatch(/no block/);
    });

    it("schedules a template in place rather than leaving it beside a dated block", async () => {
      const user = "user_template";
      const template = await toolJson<SavedBlock>(user, "save_block", {
        block: { name: "Winter base", start: null, weeks: 6 },
        workouts: [{ workout: "Max hangs", weekdays: [0] }],
      });
      await toolJson(user, "save_block", {
        id: template.block.id,
        block: { name: "Winter base", start: "2026-11-02", weeks: 6 },
        workouts: [{ workout: "Max hangs", weekdays: [0] }],
      });
      expect((await toolJson<Plan>(user, "get_plan")).blocks).toMatchObject([
        { id: template.block.id, start: "2026-11-02", workouts: [{ start: "2026-11-02" }] },
      ]);
    });

    it("refuses to edit or delete a built-in", async () => {
      const user = "user_built_in";
      expect(
        await errorOf(user, "save_exercise", { id: "pullUps", name: "Pull-ups", kind: "strength" })
      ).toMatch(/built-in exercise.*new name/);
      expect(await errorOf(user, "save_workout", { ...pullDay, id: "max10" })).toMatch(
        /built-in workout/
      );
      await toolJson(user, "save_block", {
        block: { name: "Winter base", start: "2026-11-02", weeks: 6 },
        workouts: [{ workout: "Max hangs", weekdays: [0] }],
      });
      expect(await errorOf(user, "delete_workout", { id: "max10" })).toMatch(/built-in workout/);
      expect(await errorOf(user, "delete_exercise", { id: "pullUps" })).toMatch(/built-in/);
      expect((await toolJson<Plan>(user, "get_plan")).blocks[0]?.workouts).toHaveLength(1);
    });

    it("deletes a block, a workout and an exercise, archiving an exercise a workout uses", async () => {
      const user = "user_delete";
      const workout = await toolJson<SavedWorkout>(user, "save_workout", pullDay);
      const block = await toolJson<SavedBlock>(user, "save_block", {
        block: { name: "Winter base", start: "2026-11-02", weeks: 6 },
        workouts: [{ workout: "Pull day", weekdays: [0] }],
      });
      const loose = await toolJson<{ exercise: { id: string } }>(user, "save_exercise", {
        name: "Towel hangs",
        kind: "strength",
      });
      const pullUps = (
        await toolJson<{ exercises: Array<{ id: string; name: string; builtIn?: boolean }> }>(
          user,
          "get_training_library"
        )
      ).exercises.find((e) => e.name === "Pull-ups" && !e.builtIn);

      expect(await errorOf(user + "_other", "delete_block", { id: block.block.id })).toMatch(
        /no block/
      );
      expect(await errorOf(user + "_other", "delete_workout", { id: workout.workout.id })).toMatch(
        /no workout/
      );
      expect(await errorOf(user + "_other", "delete_exercise", { id: loose.exercise.id })).toMatch(
        /no exercise/
      );

      expect(await toolJson(user, "delete_exercise", { id: pullUps?.id })).toEqual({
        removed: "archived",
      });
      expect(await toolJson(user, "delete_exercise", { id: loose.exercise.id })).toEqual({
        removed: "deleted",
      });
      expect(await toolJson(user, "delete_block", { id: block.block.id })).toEqual({
        deleted: true,
      });
      expect(await toolJson(user, "get_plan")).toEqual({ blocks: [], outsideBlocks: [] });
      expect(await toolJson(user, "delete_workout", { id: workout.workout.id })).toEqual({
        deleted: true,
      });
      expect(await mine(user)).toEqual([]);
    });
  });
});
