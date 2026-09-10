import { createExecutionContext, env, waitOnExecutionContext } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { encryptSecret } from "../src/lib/crypto";
import { jsonResponse, makeFakeFetch } from "./fakes";

function testApp(fetchImpl?: typeof fetch) {
  return createApp({
    verifyUser: async (req) => {
      const userId = req.headers.get("x-test-user");
      if (userId === null) return null;
      return { userId, hasFeature: () => false };
    },
    deleteAuthUser: async () => {},
    verifyAuthWebhook: async () => {
      throw new Error("unsigned webhook");
    },
    ...(fetchImpl === undefined ? {} : { fetchImpl }),
  });
}

async function connectStrava(
  userId: string,
  opts: { postingEnabled: boolean; postSince?: string | null; status?: string } = {
    postingEnabled: true,
  }
): Promise<void> {
  await env.DB.prepare(
    `INSERT OR IGNORE INTO users (id, timezone, created_at) VALUES (?, 'UTC', '')`
  )
    .bind(userId)
    .run();
  await env.DB.prepare(
    `INSERT INTO strava_connections
       (user_id, athlete_id, access_token_ciphertext, refresh_token_ciphertext, expires_at,
        status, connected_at, posting_enabled, post_since)
     VALUES (?, 777, ?, ?, ?, ?, '', ?, ?)`
  )
    .bind(
      userId,
      await encryptSecret("access-tok", env.TOKEN_KEY),
      await encryptSecret("refresh-tok", env.TOKEN_KEY),
      Math.floor(Date.now() / 1000) + 86_400,
      opts.status ?? "active",
      opts.postingEnabled ? 1 : 0,
      opts.postSince ?? null
    )
    .run();
}

const sessionBody = {
  date: "2026-03-04",
  startTime: "18:00",
  endTime: "19:30",
  location: "indoor",
  climbs: [
    { name: "Cave problem", grade: { scale: "v", value: 4 }, kind: "send", tries: 2 },
    { grade: { scale: "v", value: 6 }, kind: "attempt" },
  ],
};

function stravaRoutes(activityId = 424242) {
  return makeFakeFetch([
    {
      match: (url, method) => url.endsWith("/api/v3/activities") && method === "POST",
      respond: () => jsonResponse(201, { id: activityId }),
    },
    {
      match: (url, method) => url.includes(`/api/v3/activities/${activityId}`) && method === "PUT",
      respond: () => jsonResponse(200, { id: activityId }),
    },
  ]);
}

async function createSession(
  userId: string,
  fetchImpl: typeof fetch,
  body: unknown = sessionBody
): Promise<string> {
  const ctx = createExecutionContext();
  const res = await testApp(fetchImpl).request(
    "/v1/sessions",
    {
      method: "POST",
      headers: { "x-test-user": userId, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    env,
    ctx
  );
  expect(res.status).toBe(201);
  const { session } = (await res.json()) as { session: { fingerprint: string } };
  await waitOnExecutionContext(ctx);
  return session.fingerprint;
}

function postRow(userId: string, fingerprint: string) {
  return env.DB.prepare(
    `SELECT strava_activity_id, posted_at, post_state, post_error
       FROM sessions WHERE user_id = ? AND fingerprint = ?`
  )
    .bind(userId, fingerprint)
    .first<{
      strava_activity_id: number | null;
      posted_at: string | null;
      post_state: string | null;
      post_error: string | null;
    }>();
}

describe("strava posting", () => {
  it("posts a new session in a single call, carrying the effort score in the description", async () => {
    const userId = "user_post_create";
    await connectStrava(userId);
    const { fetchImpl, calls } = stravaRoutes();
    const fingerprint = await createSession(userId, fetchImpl);

    const create = calls.find((c) => c.method === "POST" && c.url.endsWith("/activities"));
    expect(create).toBeDefined();
    const form = new URLSearchParams(create?.body ?? "");
    expect(form.get("sport_type")).toBe("RockClimbing");
    expect(form.get("start_date_local")).toBe("2026-03-04T18:00:00Z");
    expect(form.get("elapsed_time")).toBe("5400");
    expect(form.get("description")).toContain("created by https://sendtally.com");
    expect(form.get("description")).toMatch(/RPE \d+\/10/);

    // Strava's public API silently drops perceived_exertion, so we never patch for it.
    expect(calls.some((c) => c.method === "PUT")).toBe(false);

    const row = await postRow(userId, fingerprint);
    expect(row?.strava_activity_id).toBe(424242);
    expect(row?.post_state).toBe("posted");
    expect(row?.posted_at).not.toBeNull();
    expect(row?.post_error).toBeNull();
  });

  it("patches the existing activity on edit instead of posting a second one", async () => {
    const userId = "user_post_edit";
    await connectStrava(userId);
    const { fetchImpl, calls } = stravaRoutes();
    const fingerprint = await createSession(userId, fetchImpl);
    const createsAfterFirstPost = calls.filter((c) => c.method === "POST").length;

    const ctx = createExecutionContext();
    const res = await testApp(fetchImpl).request(
      `/v1/sessions/${fingerprint}`,
      {
        method: "PUT",
        headers: { "x-test-user": userId, "Content-Type": "application/json" },
        body: JSON.stringify({ ...sessionBody, name: "Evening session" }),
      },
      env,
      ctx
    );
    expect(res.status).toBe(200);
    await waitOnExecutionContext(ctx);

    expect(calls.filter((c) => c.method === "POST").length).toBe(createsAfterFirstPost);
    const lastPatch = calls.filter((c) => c.method === "PUT").at(-1);
    expect(new URLSearchParams(lastPatch?.body ?? "").get("name")).not.toBeNull();
    expect((await postRow(userId, fingerprint))?.strava_activity_id).toBe(424242);
  });

  it("does not post when posting is off", async () => {
    const userId = "user_post_off";
    await connectStrava(userId, { postingEnabled: false });
    const { fetchImpl, calls } = stravaRoutes();
    const fingerprint = await createSession(userId, fetchImpl);

    expect(calls).toHaveLength(0);
    expect((await postRow(userId, fingerprint))?.post_state).toBeNull();
  });

  it("does not post a session that starts before post_since", async () => {
    const userId = "user_post_since";
    await connectStrava(userId, { postingEnabled: true, postSince: "2026-06-01T00:00:00Z" });
    const { fetchImpl, calls } = stravaRoutes();
    const fingerprint = await createSession(userId, fetchImpl);

    expect(calls).toHaveLength(0);
    expect((await postRow(userId, fingerprint))?.strava_activity_id).toBeNull();
  });

  it("does not post when Strava is not connected", async () => {
    const userId = "user_post_unconnected";
    const { fetchImpl, calls } = stravaRoutes();
    await createSession(userId, fetchImpl);
    expect(calls).toHaveLength(0);
  });

  it("records the failure and reports it from the retry endpoint", async () => {
    const userId = "user_post_fail";
    await connectStrava(userId);
    const failing = makeFakeFetch([
      {
        match: (url, method) => url.endsWith("/api/v3/activities") && method === "POST",
        respond: () => jsonResponse(500, { error: "boom" }),
      },
    ]);
    const fingerprint = await createSession(userId, failing.fetchImpl);

    const failed = await postRow(userId, fingerprint);
    expect(failed?.post_state).toBe("failed");
    expect(failed?.strava_activity_id).toBeNull();
    expect(failed?.post_error).toContain("500");

    const { fetchImpl } = stravaRoutes();
    const retry = await testApp(fetchImpl).request(
      `/v1/sessions/${fingerprint}/strava`,
      { method: "POST", headers: { "x-test-user": userId } },
      env
    );
    expect(retry.status).toBe(200);
    expect(((await retry.json()) as { outcome: string }).outcome).toBe("posted");

    const posted = await postRow(userId, fingerprint);
    expect(posted?.post_state).toBe("posted");
    expect(posted?.strava_activity_id).toBe(424242);
  });

  it("keeps a rate limited session unposted so a retry is safe", async () => {
    const userId = "user_post_429";
    await connectStrava(userId);
    const limited = makeFakeFetch([
      {
        match: (url, method) => url.endsWith("/api/v3/activities") && method === "POST",
        respond: () => jsonResponse(429, {}),
      },
    ]);
    const fingerprint = await createSession(userId, limited.fetchImpl);

    const row = await postRow(userId, fingerprint);
    expect(row?.post_state).toBe("failed");
    expect(row?.post_error).toContain("rate limit");
    expect(row?.strava_activity_id).toBeNull();
  });

  it("posts one session on request even when posting is off", async () => {
    const userId = "user_post_anyway";
    await connectStrava(userId, { postingEnabled: false });
    const quiet = stravaRoutes();
    const fingerprint = await createSession(userId, quiet.fetchImpl);
    expect(quiet.calls).toHaveLength(0);

    const { fetchImpl, calls } = stravaRoutes();
    const res = await testApp(fetchImpl).request(
      `/v1/sessions/${fingerprint}/strava`,
      { method: "POST", headers: { "x-test-user": userId } },
      env
    );
    expect(res.status).toBe(200);
    expect(((await res.json()) as { outcome: string }).outcome).toBe("posted");
    expect(calls.some((c) => c.method === "POST")).toBe(true);
    expect((await postRow(userId, fingerprint))?.strava_activity_id).toBe(424242);
  });

  it("posts one session on request even when it predates post_since", async () => {
    const userId = "user_post_anyway_since";
    await connectStrava(userId, { postingEnabled: true, postSince: "2026-06-01T00:00:00Z" });
    const quiet = stravaRoutes();
    const fingerprint = await createSession(userId, quiet.fetchImpl);
    expect(quiet.calls).toHaveLength(0);

    const { fetchImpl } = stravaRoutes();
    const res = await testApp(fetchImpl).request(
      `/v1/sessions/${fingerprint}/strava`,
      { method: "POST", headers: { "x-test-user": userId } },
      env
    );
    expect(((await res.json()) as { outcome: string }).outcome).toBe("posted");
  });

  it("never posts a legacy board session", async () => {
    const userId = "user_post_board";
    await connectStrava(userId);
    await env.DB.prepare(
      `INSERT INTO sessions (user_id, fingerprint, board, source, start_at, end_at,
         climb_count, top_grade, rpe, title, summary, climbs_json)
       VALUES (?, 'fp_board', 'tension', 'board', '2026-03-04T18:00:00Z', '2026-03-04T19:00:00Z',
         3, 5, 6, 't', 's', '[]')`
    )
      .bind(userId)
      .run();

    const { fetchImpl, calls } = stravaRoutes();
    const res = await testApp(fetchImpl).request(
      `/v1/sessions/fp_board/strava`,
      { method: "POST", headers: { "x-test-user": userId } },
      env
    );
    expect(res.status).toBe(200);
    expect((await res.json()) as { outcome: string }).toMatchObject({ outcome: "skipped" });
    expect(calls).toHaveLength(0);
  });

  it("turns posting on and reports it from status", async () => {
    const userId = "user_posting_toggle";
    await connectStrava(userId, { postingEnabled: false });

    const res = await testApp().request(
      "/v1/connections/strava/posting",
      {
        method: "PUT",
        headers: { "x-test-user": userId, "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: true, since: "2026-01-01" }),
      },
      env
    );
    expect(res.status).toBe(200);

    const status = await testApp().request(
      "/v1/status",
      { headers: { "x-test-user": userId } },
      env
    );
    expect((await status.json()) as { strava: unknown }).toMatchObject({
      strava: { postingEnabled: true, postSince: "2026-01-01T00:00:00Z" },
    });
  });
});
