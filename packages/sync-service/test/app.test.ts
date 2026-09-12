import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import type { SessionDetail } from "@sendtally/api-client";
import { draftFromSession, toLogSessionInput } from "@sendtally/features/log-session/transforms";
import { createApp, type AppDeps } from "../src/app";
import { decryptSecret, encryptSecret } from "../src/lib/crypto";
import { jsonResponse, makeFakeFetch } from "./fakes";

type TestOverrides = Partial<Pick<AppDeps, "deleteAuthUser" | "verifyAuthWebhook">>;

// Tests never reach the network: anything a test does not stub throws inside
// the fake. Account deletion always forgets the RevenueCat subscriber, so that
// one call is answered here rather than in every deletion test.
const offlineFetch = makeFakeFetch([
  {
    match: (url, method) => method === "DELETE" && url.startsWith("https://api.revenuecat.com/"),
    respond: () => jsonResponse(200, { deleted: true }),
  },
]).fetchImpl;

function testApp(fetchImpl: typeof fetch = offlineFetch, overrides: TestOverrides = {}) {
  return createApp({
    verifyUser: async (req) => {
      const userId = req.headers.get("x-test-user");
      if (userId === null) return null;
      const features = (req.headers.get("x-test-features") ?? "").split(",");
      return { userId, hasFeature: (feature) => features.includes(feature) };
    },
    deleteAuthUser: async () => {},
    verifyAuthWebhook: async () => {
      throw new Error("unsigned webhook");
    },
    ...overrides,
    fetchImpl,
  });
}

describe("app", () => {
  it("serves health without auth", async () => {
    const res = await testApp().request("/health", {}, env);
    expect(res.status).toBe(200);
  });

  it("rejects /v1 routes without a verified user", async () => {
    const res = await testApp().request("/v1/sessions", {}, env);
    expect(res.status).toBe(401);
  });

  it("answers the Strava webhook verification challenge", async () => {
    const res = await testApp().request(
      "/webhooks/strava?hub.verify_token=test-verify-token&hub.challenge=ch-123",
      {},
      env
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ "hub.challenge": "ch-123" });

    const bad = await testApp().request("/webhooks/strava?hub.verify_token=nope", {}, env);
    expect(bad.status).toBe(403);
  });

  it("marks the Strava connection dead on a deauthorization event", async () => {
    await env.DB.prepare(
      `INSERT INTO users (id, timezone, created_at) VALUES ('user_deauth', 'UTC', '')`
    ).run();
    await env.DB.prepare(
      `INSERT INTO strava_connections (user_id, athlete_id, access_token_ciphertext, refresh_token_ciphertext, expires_at, status, connected_at)
       VALUES ('user_deauth', 555, 'x', 'y', 0, 'active', '')`
    ).run();

    const res = await testApp().request(
      "/webhooks/strava",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          object_type: "athlete",
          object_id: 555,
          aspect_type: "update",
          updates: { authorized: "false" },
        }),
      },
      env
    );
    expect(res.status).toBe(200);

    const conn = await env.DB.prepare(
      `SELECT status FROM strava_connections WHERE athlete_id = 555`
    ).first<{ status: string }>();
    expect(conn?.status).toBe("dead");
  });

  it("completes the OAuth callback for a user with no users row yet", async () => {
    const state = await encryptSecret(
      JSON.stringify({ userId: "user_fresh", nonce: "n", exp: Date.now() + 60_000 }),
      env.TOKEN_KEY
    );
    const { fetchImpl } = makeFakeFetch([
      {
        match: (url) => url.includes("/oauth/token"),
        respond: () =>
          jsonResponse(200, {
            access_token: "at",
            refresh_token: "rt",
            expires_at: 4102444800,
            athlete: { id: 1234 },
          }),
      },
    ]);
    const res = await testApp(fetchImpl).request(
      `/connect/strava/callback?code=x&state=${encodeURIComponent(state)}`,
      {},
      env
    );
    expect(res.status).toBe(302);
    const conn = await env.DB.prepare(
      `SELECT athlete_id FROM strava_connections WHERE user_id = 'user_fresh'`
    ).first<{ athlete_id: number }>();
    expect(conn?.athlete_id).toBe(1234);
  });

  it("binds the OAuth callback to the browser nonce when the cookie is present", async () => {
    await env.DB.prepare(
      `INSERT INTO users (id, timezone, created_at) VALUES ('user_oauth', 'UTC', '')`
    ).run();
    const state = await encryptSecret(
      JSON.stringify({ userId: "user_oauth", nonce: "good-nonce", exp: Date.now() + 60_000 }),
      env.TOKEN_KEY
    );
    const { fetchImpl } = makeFakeFetch([
      {
        match: (url) => url.includes("/oauth/token"),
        respond: () =>
          jsonResponse(200, {
            access_token: "at",
            refresh_token: "rt",
            expires_at: 4102444800,
            athlete: { id: 999 },
          }),
      },
    ]);
    const path = `/connect/strava/callback?code=x&state=${encodeURIComponent(state)}`;

    const mismatched = await testApp(fetchImpl).request(
      path,
      { headers: { Cookie: "st_oauth=evil-nonce" } },
      env
    );
    expect(mismatched.status).toBe(400);

    const matched = await testApp(fetchImpl).request(
      path,
      { headers: { Cookie: "st_oauth=good-nonce" } },
      env
    );
    expect(matched.status).toBe(302);

    const noCookie = await testApp(fetchImpl).request(path, {}, env);
    expect(noCookie.status).toBe(302);

    const conn = await env.DB.prepare(
      `SELECT athlete_id FROM strava_connections WHERE user_id = 'user_oauth'`
    ).first<{ athlete_id: number }>();
    expect(conn?.athlete_id).toBe(999);
  });

  const logBody = (overrides: Record<string, unknown> = {}) => ({
    name: "Gym bouldering",
    date: "2026-08-20",
    startTime: "18:00",
    endTime: "20:00",
    location: "indoor",
    climbs: [
      { name: "Cave problem", grade: { scale: "v", value: 4 }, kind: "send", tries: 2 },
      { grade: { scale: "font", value: "6C+" } },
      { grade: { scale: "v", value: 6 }, kind: "attempt" },
    ],
    ...overrides,
  });

  it("catalogues named climbs and applies project flags on save", async () => {
    await postSession("user_projects", logBody());
    const flagged = await postSession(
      "user_projects",
      logBody({
        date: "2026-08-22",
        climbs: [
          {
            name: "Cave Problem",
            grade: { scale: "v", value: 4 },
            kind: "attempt",
            tries: 5,
            project: true,
          },
          { name: "Warm up", grade: { scale: "v", value: 1 } },
        ],
      })
    );
    expect(flagged.status).toBe(201);
    const headers = { "x-test-user": "user_projects", "Content-Type": "application/json" };

    const listed = await testApp().request("/v1/climbs", { headers }, env);
    expect(listed.status).toBe(200);
    const { climbs } = (await listed.json()) as { climbs: Array<Record<string, unknown>> };
    expect(climbs).toEqual([
      {
        slug: "cave-problem",
        name: "Cave Problem",
        grade: { scale: "v", value: 4 },
        discipline: "boulder",
        project: true,
        beta: null,
        beta_updated_at: null,
        sessions: 2,
        attempts: 7,
        sends: 1,
        first_at: "2026-08-20T18:00:00.000Z",
        last_at: "2026-08-22T18:00:00.000Z",
      },
      {
        slug: "warm-up",
        name: "Warm up",
        grade: { scale: "v", value: 1 },
        discipline: "boulder",
        project: false,
        beta: null,
        beta_updated_at: null,
        sessions: 1,
        attempts: 1,
        sends: 1,
        first_at: "2026-08-22T18:00:00.000Z",
        last_at: "2026-08-22T18:00:00.000Z",
      },
    ]);

    const { session } = (await flagged.json()) as { session: { fingerprint: string } };
    const unflagged = await testApp().request(
      `/v1/sessions/${session.fingerprint}`,
      {
        method: "PUT",
        headers,
        body: JSON.stringify(
          logBody({
            date: "2026-08-22",
            climbs: [
              { name: "Cave Problem", grade: { scale: "v", value: 4 }, project: false },
              { name: "Warm up", grade: { scale: "v", value: 1 } },
            ],
          })
        ),
      },
      env
    );
    expect(unflagged.status).toBe(200);
    const relisted = await testApp().request("/v1/climbs", { headers }, env);
    const after = (await relisted.json()) as { climbs: Array<{ slug: string; project: boolean }> };
    expect(after.climbs.map((c) => [c.slug, c.project])).toEqual([
      ["cave-problem", false],
      ["warm-up", false],
    ]);

    const gone = await testApp().request(
      "/v1/projects/cave-problem",
      { method: "DELETE", headers },
      env
    );
    expect(gone.status).toBe(404);
  });

  it("adds a project with no grade and edits its beta", async () => {
    const headers = { "x-test-user": "user_addproject", "Content-Type": "application/json" };
    const created = await testApp().request(
      "/v1/projects",
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: "  The Prow  ",
          discipline: "route",
          beta: " Rest at the jug ",
        }),
      },
      env
    );
    expect(created.status).toBe(200);
    expect(await created.json()).toEqual({ slug: "the-prow" });

    const listed = await testApp().request("/v1/climbs", { headers }, env);
    const { climbs } = (await listed.json()) as { climbs: Array<Record<string, unknown>> };
    expect(climbs).toHaveLength(1);
    expect(climbs[0]).toMatchObject({
      slug: "the-prow",
      name: "The Prow",
      grade: null,
      discipline: "route",
      project: true,
      beta: "Rest at the jug",
      sessions: 0,
      attempts: 0,
    });

    const edited = await testApp().request(
      "/v1/projects",
      { method: "POST", headers, body: JSON.stringify({ name: "The Prow", beta: "Skip the jug" }) },
      env
    );
    expect(edited.status).toBe(200);
    const relisted = await testApp().request("/v1/climbs", { headers }, env);
    const after = (await relisted.json()) as { climbs: Array<Record<string, unknown>> };
    expect(after.climbs[0]).toMatchObject({ discipline: "route", beta: "Skip the jug" });

    const rejected = await testApp().request(
      "/v1/projects",
      { method: "POST", headers, body: JSON.stringify({ name: "   " }) },
      env
    );
    expect(rejected.status).toBe(400);
  });

  const postSession = (userId: string, body: unknown) =>
    testApp().request(
      "/v1/sessions",
      {
        method: "POST",
        headers: { "x-test-user": userId, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
      env
    );

  type ManualSessionResponse = {
    session: {
      fingerprint: string;
      board: string | null;
      source: string;
      location: string | null;
      name: string | null;
      start_at: string;
      end_at: string;
      climb_count: number;
      top_grade: number;
      top_send_grade: number;
      top_grade_label: string | null;
      top_send_grade_label: string | null;
      rpe: number;
      title: string;
      inProgress: boolean;
      climbs: Array<{
        time: string;
        name: string;
        vGrade: number;
        kind: string;
        tries: number;
        grade: { scale: string; value: string | number };
      }>;
    };
  };

  const setTags = (userId: string, fingerprint: string, tags: unknown) =>
    testApp().request(
      `/v1/sessions/${encodeURIComponent(fingerprint)}/tags`,
      {
        method: "PUT",
        headers: { "x-test-user": userId, "Content-Type": "application/json" },
        body: JSON.stringify({ tags }),
      },
      env
    );

  const listTags = (userId: string) =>
    testApp().request("/v1/tags", { headers: { "x-test-user": userId } }, env);

  type Tag = { id: string; name: string; slug: string };

  it("stores tags given when a session is logged and reads them back", async () => {
    const res = await postSession("user_tags_create", logBody({ tags: ["Endurance", "  Home "] }));
    expect(res.status).toBe(201);
    const { session } = (await res.json()) as ManualSessionResponse & { session: { tags: Tag[] } };
    expect(session.tags.map((t) => t.name)).toEqual(["Endurance", "Home"]);
    expect(session.tags.map((t) => t.slug)).toEqual(["endurance", "home"]);

    const list = await testApp().request(
      "/v1/sessions",
      { headers: { "x-test-user": "user_tags_create" } },
      env
    );
    const { sessions } = (await list.json()) as { sessions: Array<{ tags: Tag[] }> };
    expect(sessions[0]?.tags.map((t) => t.slug)).toEqual(["endurance", "home"]);
  });

  it("reuses one tag row across sessions that spell it differently", async () => {
    const first = await postSession("user_tags_reuse", logBody({ tags: ["Bishop"] }));
    const second = await postSession("user_tags_reuse", logBody({ tags: ["bishop"] }));
    const a = (await first.json()) as { session: { tags: Tag[] } };
    const b = (await second.json()) as { session: { tags: Tag[] } };
    expect(b.session.tags[0]?.id).toBe(a.session.tags[0]?.id);
    expect(b.session.tags[0]?.name).toBe("Bishop");

    const tags = (await (await listTags("user_tags_reuse")).json()) as {
      tags: Array<Tag & { session_count: number }>;
    };
    expect(tags.tags).toHaveLength(1);
    expect(tags.tags[0]?.session_count).toBe(2);
  });

  it("replaces a session's tags and prunes the ones left unused", async () => {
    const created = await postSession(
      "user_tags_replace",
      logBody({ tags: ["Projecting", "Home"] })
    );
    const { session } = (await created.json()) as { session: { fingerprint: string } };

    const res = await setTags("user_tags_replace", session.fingerprint, ["Home", "Bishop"]);
    expect(res.status).toBe(200);
    const { tags } = (await res.json()) as { tags: Tag[] };
    expect(tags.map((t) => t.slug)).toEqual(["home", "bishop"]);

    const all = (await (await listTags("user_tags_replace")).json()) as { tags: Tag[] };
    expect(all.tags.map((t) => t.slug).sort()).toEqual(["bishop", "home"]);
  });

  const setNotes = (userId: string, fingerprint: string, notes: unknown) =>
    testApp().request(
      `/v1/sessions/${encodeURIComponent(fingerprint)}/notes`,
      {
        method: "PUT",
        headers: { "x-test-user": userId, "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      },
      env
    );

  const readNotes = async (userId: string, fingerprint: string) => {
    const res = await testApp().request(
      `/v1/sessions/${encodeURIComponent(fingerprint)}`,
      { headers: { "x-test-user": userId } },
      env
    );
    return ((await res.json()) as { session: { notes: string | null } }).session.notes;
  };

  it("keeps the note given when a session is logged and lets an edit replace it", async () => {
    const res = await postSession("user_notes", logBody({ notes: "  Shoulder held up.  " }));
    const { session } = (await res.json()) as ManualSessionResponse;
    expect(await readNotes("user_notes", session.fingerprint)).toBe("Shoulder held up.");

    const saved = await setNotes("user_notes", session.fingerprint, "Heel kept rolling off.");
    expect(saved.status).toBe(200);
    expect(await readNotes("user_notes", session.fingerprint)).toBe("Heel kept rolling off.");
  });

  it("clears a note written as blank and rejects one over the limit", async () => {
    const res = await postSession("user_notes_clear", logBody({ notes: "First pass." }));
    const { session } = (await res.json()) as ManualSessionResponse;

    expect((await setNotes("user_notes_clear", session.fingerprint, "   ")).status).toBe(200);
    expect(await readNotes("user_notes_clear", session.fingerprint)).toBeNull();

    const tooLong = await setNotes("user_notes_clear", session.fingerprint, "x".repeat(2001));
    expect(tooLong.status).toBe(400);
  });

  it("notes a legacy board session without touching the session row", async () => {
    await env.DB.prepare(
      `INSERT INTO users (id, timezone, created_at) VALUES ('user_notes_board', 'UTC', '')`
    ).run();
    await env.DB.prepare(
      `INSERT INTO sessions (user_id, fingerprint, board, source, start_at, end_at, climb_count, top_grade, top_send_grade, rpe, title, summary)
       VALUES ('user_notes_board', 'fp_board_note', 'tension', 'board', '2026-01-01T00:00:00.000Z', '2026-01-01T01:00:00.000Z', 4, 5, 5, 6, 'Board session', 's')`
    ).run();

    expect((await setNotes("user_notes_board", "fp_board_note", "Old history.")).status).toBe(200);

    const row = await env.DB.prepare(
      `SELECT source, title, rpe, notes FROM sessions WHERE fingerprint = 'fp_board_note'`
    ).first<{ source: string; title: string; rpe: number; notes: string }>();
    expect(row).toEqual({ source: "board", title: "Board session", rpe: 6, notes: "Old history." });
  });

  it("tags a legacy board session without touching the session row", async () => {
    await env.DB.prepare(
      `INSERT INTO users (id, timezone, created_at) VALUES ('user_tags_board', 'UTC', '')`
    ).run();
    await env.DB.prepare(
      `INSERT INTO sessions (user_id, fingerprint, board, source, start_at, end_at, climb_count, top_grade, top_send_grade, rpe, title, summary)
       VALUES ('user_tags_board', 'fp_board_tag', 'tension', 'board', '2026-01-01T00:00:00.000Z', '2026-01-01T01:00:00.000Z', 4, 5, 5, 6, 'Board session', 's')`
    ).run();

    const res = await setTags("user_tags_board", "fp_board_tag", ["Power Endurance"]);
    expect(res.status).toBe(200);

    const row = await env.DB.prepare(
      `SELECT source, title FROM sessions WHERE fingerprint = 'fp_board_tag'`
    ).first<{ source: string; title: string }>();
    expect(row).toEqual({ source: "board", title: "Board session" });
  });

  it("prunes the tags of a deleted board session", async () => {
    await env.DB.prepare(
      `INSERT INTO users (id, timezone, created_at) VALUES ('user_board_del_tags', 'UTC', '')`
    ).run();
    await env.DB.prepare(
      `INSERT INTO sessions (user_id, fingerprint, board, source, start_at, end_at, climb_count, top_grade, top_send_grade, rpe, title, summary)
       VALUES ('user_board_del_tags', 'fp_board_del', 'tension', 'board', '2026-01-01T00:00:00.000Z', '2026-01-01T01:00:00.000Z', 4, 5, 5, 6, 'Board session', 's')`
    ).run();
    await setTags("user_board_del_tags", "fp_board_del", ["Power Endurance"]);

    const res = await testApp().request(
      "/v1/sessions/fp_board_del",
      { method: "DELETE", headers: { "x-test-user": "user_board_del_tags" } },
      env
    );
    expect(res.status).toBe(200);

    const all = (await (await listTags("user_board_del_tags")).json()) as { tags: Tag[] };
    expect(all.tags).toEqual([]);
  });

  it("clears a session's tags when given an empty list", async () => {
    const created = await postSession("user_tags_clear", logBody({ tags: ["Endurance"] }));
    const { session } = (await created.json()) as { session: { fingerprint: string } };

    const res = await setTags("user_tags_clear", session.fingerprint, []);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ tags: [] });

    const all = (await (await listTags("user_tags_clear")).json()) as { tags: Tag[] };
    expect(all.tags).toEqual([]);
  });

  it("keeps tags scoped to their owner", async () => {
    await postSession("user_tags_mine", logBody({ tags: ["Endurance"] }));
    const theirs = (await (await listTags("user_tags_theirs")).json()) as { tags: Tag[] };
    expect(theirs.tags).toEqual([]);
  });

  it("rejects a tag with nothing sluggable in it", async () => {
    const created = await postSession("user_tags_bad", logBody());
    const { session } = (await created.json()) as { session: { fingerprint: string } };
    const res = await setTags("user_tags_bad", session.fingerprint, ["!!!"]);
    expect(res.status).toBe(400);
  });

  it("404s when tagging a session that is not yours", async () => {
    const created = await postSession("user_tags_owner", logBody());
    const { session } = (await created.json()) as { session: { fingerprint: string } };
    const res = await setTags("user_tags_stranger", session.fingerprint, ["Endurance"]);
    expect(res.status).toBe(404);
  });

  it("drops tag links when the session is deleted", async () => {
    const created = await postSession("user_tags_delete", logBody({ tags: ["Endurance"] }));
    const { session } = (await created.json()) as { session: { fingerprint: string } };

    const res = await testApp().request(
      `/v1/sessions/${session.fingerprint}`,
      { method: "DELETE", headers: { "x-test-user": "user_tags_delete" } },
      env
    );
    expect(res.status).toBe(200);

    const all = (await (await listTags("user_tags_delete")).json()) as { tags: Tag[] };
    expect(all.tags).toEqual([]);
    const links = await env.DB.prepare(
      `SELECT COUNT(*) AS n FROM session_tags WHERE user_id = 'user_tags_delete'`
    ).first<{ n: number }>();
    expect(links?.n).toBe(0);
  });

  it("clears tags when the account is deleted", async () => {
    await postSession("user_tags_purge", logBody({ tags: ["Endurance"] }));
    const res = await testApp().request(
      "/v1/account",
      { method: "DELETE", headers: { "x-test-user": "user_tags_purge" } },
      env
    );
    expect(res.status).toBe(200);

    const rows = await env.DB.prepare(
      `SELECT (SELECT COUNT(*) FROM tags WHERE user_id = 'user_tags_purge') AS tags,
              (SELECT COUNT(*) FROM session_tags WHERE user_id = 'user_tags_purge') AS links`
    ).first<{ tags: number; links: number }>();
    expect(rows).toEqual({ tags: 0, links: 0 });
  });

  it("logs a manual session with converted grades and a scored effort", async () => {
    const res = await postSession("user_manual", logBody());
    expect(res.status).toBe(201);
    const { session } = (await res.json()) as ManualSessionResponse;

    expect(session.fingerprint).toMatch(/^manual-/);
    expect(session.source).toBe("manual");
    expect(session.board).toBeNull();
    expect(session.location).toBe("indoor");
    expect(session.name).toBe("Gym bouldering");
    expect(session.title).toBe("Gym bouldering");
    expect(session.start_at).toBe("2026-08-20T18:00:00.000Z");
    expect(session.end_at).toBe("2026-08-20T20:00:00.000Z");
    expect(session.climb_count).toBe(3);
    expect(session.top_grade).toBe(6);
    expect(session.top_send_grade).toBe(5);
    expect(session.rpe).toBeGreaterThanOrEqual(1);
    expect(session.rpe).toBeLessThanOrEqual(10);
    expect(session.inProgress).toBe(false);

    expect(session.climbs).toHaveLength(3);
    expect(session.climbs[0]).toMatchObject({
      name: "Cave problem",
      vGrade: 4,
      kind: "send",
      tries: 2,
      grade: { scale: "v", value: 4 },
    });
    expect(session.climbs[1]).toMatchObject({
      vGrade: 5,
      kind: "send",
      tries: 1,
      grade: { scale: "font", value: "6C+" },
    });
    expect(session.climbs[2]).toMatchObject({ vGrade: 6, kind: "attempt" });

    const row = await env.DB.prepare(
      `SELECT source, board, location, name, summary FROM sessions WHERE user_id = 'user_manual'`
    ).first<{
      source: string;
      board: string | null;
      location: string;
      name: string;
      summary: string;
    }>();
    expect(row?.source).toBe("manual");
    expect(row?.board).toBeNull();
    expect(row?.location).toBe("indoor");
    expect(row?.summary).toContain("created by https://sendtally.com");
  });

  it("never marks a manual session in progress, even with a recent end time", async () => {
    const userId = "user_manual_recent";
    const start = new Date(Date.now() - 30 * 60_000);
    const end = new Date(start.getTime() + 25 * 60_000);
    const res = await postSession(
      userId,
      logBody({
        date: start.toISOString().slice(0, 10),
        startTime: start.toISOString().slice(11, 16),
        endTime: end.toISOString().slice(11, 16),
      })
    );
    expect(res.status).toBe(201);
    const { session } = (await res.json()) as ManualSessionResponse;
    expect(session.inProgress).toBe(false);

    const list = await testApp().request(
      "/v1/sessions",
      { headers: { "x-test-user": userId } },
      env
    );
    const body = (await list.json()) as {
      sessions: Array<{ fingerprint: string; source: string; inProgress: boolean }>;
    };
    expect(body.sessions).toHaveLength(1);
    expect(body.sessions[0]?.source).toBe("manual");
    expect(body.sessions[0]?.inProgress).toBe(false);
  });

  it("logs a route session in YDS and French and reads it back in those scales", async () => {
    const userId = "user_manual_routes";
    const res = await postSession(
      userId,
      logBody({
        name: undefined,
        climbs: [
          { name: "Warm up", grade: { scale: "yds", value: "5.10A" } },
          { name: "Pumpfest", grade: { scale: "yds", value: "5.11d" }, tries: 2 },
          { name: "Project", grade: { scale: "french", value: "7A+" }, kind: "attempt" },
        ],
      })
    );
    expect(res.status).toBe(201);
    const { session } = (await res.json()) as ManualSessionResponse;
    expect(session.climbs.map((c) => c.grade)).toEqual([
      { scale: "yds", value: "5.10a" },
      { scale: "yds", value: "5.11d" },
      { scale: "french", value: "7a+" },
    ]);
    expect(session.climbs.map((c) => c.vGrade)).toEqual([0, 3, 4]);
    expect(session.top_grade).toBe(4);
    expect(session.top_send_grade).toBe(3);
    expect(session.top_grade_label).toBe("7a+");
    expect(session.top_send_grade_label).toBe("5.11d");
    expect(session.title).toContain("3 climbs, top 7a+");
  });

  it("rejects route grades outside the ladders", async () => {
    for (const grade of [
      { scale: "yds", value: "5.10" },
      { scale: "yds", value: "5.16a" },
      { scale: "french", value: "6d" },
      { scale: "french", value: "V4" },
    ]) {
      const res = await postSession("user_manual_bad_routes", logBody({ climbs: [{ grade }] }));
      expect(res.status).toBe(400);
    }
  });

  it("rejects invalid manual session bodies", async () => {
    const bad = [
      logBody({ climbs: [] }),
      logBody({ climbs: [{ grade: { scale: "font", value: "6D" } }] }),
      logBody({ climbs: [{ grade: { scale: "v", value: 99 } }] }),
      logBody({ date: "2026-02-31" }),
      logBody({ date: "20-08-2026" }),
      logBody({ location: "moon" }),
      logBody({ rpe: 11 }),
      logBody({ rpe: 6.5 }),
      logBody({ startTime: "18:00", endTime: "07:00" }),
    ];
    for (const body of bad) {
      const res = await postSession("user_manual_bad", body);
      expect(res.status).toBe(400);
    }
  });

  it("uses a manual RPE override for the score and summary", async () => {
    const res = await postSession("user_manual_rpe", logBody({ rpe: 9, name: undefined }));
    expect(res.status).toBe(201);
    const { session } = (await res.json()) as ManualSessionResponse;
    expect(session.rpe).toBe(9);
    expect(session.title).toContain("Hard climbing session");

    const row = await env.DB.prepare(
      `SELECT summary FROM sessions WHERE user_id = 'user_manual_rpe'`
    ).first<{ summary: string }>();
    expect(row?.summary).toContain("RPE 9/10");
  });

  it("wraps an end time past midnight into the next day", async () => {
    const res = await postSession(
      "user_manual_midnight",
      logBody({ startTime: "23:00", endTime: "01:00" })
    );
    expect(res.status).toBe(201);
    const { session } = (await res.json()) as ManualSessionResponse;
    expect(session.start_at).toBe("2026-08-20T23:00:00.000Z");
    expect(session.end_at).toBe("2026-08-21T01:00:00.000Z");
  });

  it("defaults to a 90-minute session when no end time is given", async () => {
    const res = await postSession("user_manual_defaults", logBody({ endTime: undefined }));
    expect(res.status).toBe(201);
    const { session } = (await res.json()) as ManualSessionResponse;
    expect(session.end_at).toBe("2026-08-20T19:30:00.000Z");
  });

  it("updates a manual session and re-scores it", async () => {
    const userId = "user_manual_edit";
    const created = await postSession(userId, logBody());
    const { session } = (await created.json()) as ManualSessionResponse;

    const updated = await testApp().request(
      `/v1/sessions/${session.fingerprint}`,
      {
        method: "PUT",
        headers: { "x-test-user": userId, "Content-Type": "application/json" },
        body: JSON.stringify(
          logBody({
            name: undefined,
            location: "outdoor",
            climbs: [{ grade: { scale: "font", value: "7A" }, kind: "send" }],
          })
        ),
      },
      env
    );
    expect(updated.status).toBe(200);
    const { session: after } = (await updated.json()) as ManualSessionResponse;
    expect(after.fingerprint).toBe(session.fingerprint);
    expect(after.location).toBe("outdoor");
    expect(after.name).toBeNull();
    expect(after.title).toContain("climbing session");
    expect(after.climb_count).toBe(1);
    expect(after.top_grade).toBe(6);
  });

  // The edit screen loads a session, rebuilds the form draft from it, and PUTs
  // that draft back. Anything the draft cannot express is silently lost, so the
  // round trip is asserted against the real API rather than a fixture.
  it("survives a no-op edit made through the client's own draft transforms", async () => {
    const userId = "user_manual_roundtrip";
    const body = logBody({
      tags: ["Endurance"],
      rpe: 8,
      climbs: [
        { name: "Cave problem", grade: { scale: "font", value: "6C+" }, kind: "send", tries: 2 },
        { grade: { scale: "font", value: "7A" }, kind: "attempt", tries: 4 },
      ],
    });
    const created = await postSession(userId, body);
    const { session: before } = (await created.json()) as ManualSessionResponse;

    const draft = draftFromSession(before as unknown as SessionDetail);
    expect(draft.scale).toBe("font");

    const updated = await testApp().request(
      `/v1/sessions/${before.fingerprint}`,
      {
        method: "PUT",
        headers: { "x-test-user": userId, "Content-Type": "application/json" },
        body: JSON.stringify(toLogSessionInput(draft)),
      },
      env
    );
    expect(updated.status).toBe(200);
    const { session: after } = (await updated.json()) as ManualSessionResponse;
    expect(after).toEqual(before);
  });

  it("preserves every climb's grade when a mixed-scale session is edited", async () => {
    const userId = "user_manual_mixed";
    const created = await postSession(userId, logBody());
    const { session: before } = (await created.json()) as ManualSessionResponse;

    const updated = await testApp().request(
      `/v1/sessions/${before.fingerprint}`,
      {
        method: "PUT",
        headers: { "x-test-user": userId, "Content-Type": "application/json" },
        body: JSON.stringify(
          toLogSessionInput(draftFromSession(before as unknown as SessionDetail))
        ),
      },
      env
    );
    const { session: after } = (await updated.json()) as ManualSessionResponse;
    expect(after.climbs.map((c) => c.vGrade)).toEqual(before.climbs.map((c) => c.vGrade));
    expect(after.climbs.map((c) => c.tries)).toEqual(before.climbs.map((c) => c.tries));
    expect(after.climbs.map((c) => c.kind)).toEqual(before.climbs.map((c) => c.kind));
    expect(after.top_grade).toBe(before.top_grade);
    expect(after.top_send_grade).toBe(before.top_send_grade);
  });

  it("refuses to edit a board-synced session but lets its owner delete it", async () => {
    const userId = "user_manual_guard";
    await env.DB.prepare(`INSERT INTO users (id, timezone, created_at) VALUES (?, 'UTC', '')`)
      .bind(userId)
      .run();
    await env.DB.prepare(
      `INSERT INTO sessions (user_id, fingerprint, board, start_at, end_at, climb_count, top_grade, rpe, title, summary, climbs_json)
       VALUES (?, 'fp_board', 'tension', '2026-08-01T18:00:00.000Z', '2026-08-01T19:00:00.000Z', 1, 4, 5, 'T', 'S', '[]')`
    )
      .bind(userId)
      .run();

    const put = await testApp().request(
      "/v1/sessions/fp_board",
      {
        method: "PUT",
        headers: { "x-test-user": userId, "Content-Type": "application/json" },
        body: JSON.stringify(logBody()),
      },
      env
    );
    expect(put.status).toBe(409);

    const del = await testApp().request(
      "/v1/sessions/fp_board",
      { method: "DELETE", headers: { "x-test-user": userId } },
      env
    );
    expect(del.status).toBe(200);
    const gone = await env.DB.prepare(
      `SELECT COUNT(*) AS n FROM sessions WHERE user_id = ? AND fingerprint = 'fp_board'`
    )
      .bind(userId)
      .first<{ n: number }>();
    expect(gone?.n).toBe(0);

    const missing = await testApp().request(
      "/v1/sessions/manual-nope",
      { method: "DELETE", headers: { "x-test-user": userId } },
      env
    );
    expect(missing.status).toBe(404);
  });

  it("deletes a manual session", async () => {
    const userId = "user_manual_delete";
    const created = await postSession(userId, logBody());
    const { session } = (await created.json()) as ManualSessionResponse;

    const del = await testApp().request(
      `/v1/sessions/${session.fingerprint}`,
      { method: "DELETE", headers: { "x-test-user": userId } },
      env
    );
    expect(del.status).toBe(200);
    expect(await del.json()).toEqual({ deleted: true });

    const row = await env.DB.prepare(`SELECT COUNT(*) AS n FROM sessions WHERE user_id = ?`)
      .bind(userId)
      .first<{ n: number }>();
    expect(row?.n).toBe(0);
  });

  it("deletes the account: revokes Strava, clears D1 rows, removes the Clerk user", async () => {
    const userId = "user_delete_account";
    await env.DB.prepare(`INSERT INTO users (id, timezone, created_at) VALUES (?, 'UTC', '')`)
      .bind(userId)
      .run();
    await env.DB.prepare(
      `INSERT INTO strava_connections (user_id, athlete_id, access_token_ciphertext, refresh_token_ciphertext, expires_at, status, connected_at)
       VALUES (?, 999, ?, ?, ?, 'active', '')`
    )
      .bind(
        userId,
        await encryptSecret("access-tok", env.TOKEN_KEY),
        await encryptSecret("refresh-tok", env.TOKEN_KEY),
        Math.floor(Date.now() / 1000) + 3600
      )
      .run();
    await env.DB.prepare(
      `INSERT INTO sync_state (user_id, last_synced_at, last_error) VALUES (?, '', NULL)`
    )
      .bind(userId)
      .run();
    await env.DB.prepare(
      `INSERT INTO sessions (user_id, fingerprint, board, start_at, end_at, climb_count, top_grade, rpe, title, summary, climbs_json)
       VALUES (?, 'fp_x', 'tension', '2025-01-01T00:00:00Z', '2025-01-01T01:00:00Z', 3, 5, 6, 't', 's', '[]')`
    )
      .bind(userId)
      .run();
    await env.DB.prepare(
      `INSERT INTO board_connections (user_id, board, board_user_id, token_ciphertext, status, connected_at)
       VALUES (?, 'tension', 42, 'legacy-board-token', 'dead', '')`
    )
      .bind(userId)
      .run();

    const { fetchImpl, calls } = makeFakeFetch([
      {
        match: (url, method) => url.endsWith("/oauth/deauthorize") && method === "POST",
        respond: () => jsonResponse(200, { access_token: "access-tok" }),
      },
    ]);
    const deleted: string[] = [];

    const res = await testApp(fetchImpl, {
      deleteAuthUser: async (id) => void deleted.push(id),
    }).request("/v1/account", { method: "DELETE", headers: { "x-test-user": userId } }, env);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ deleted: true });
    expect(deleted).toEqual([userId]);

    const deauth = calls.find((c) => c.url.endsWith("/oauth/deauthorize"));
    expect(deauth?.headers["authorization"]).toBe("Bearer access-tok");

    for (const table of [
      "users",
      "strava_connections",
      "board_connections",
      "sync_state",
      "sessions",
    ]) {
      const column = table === "users" ? "id" : "user_id";
      const row = await env.DB.prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE ${column} = ?`)
        .bind(userId)
        .first<{ n: number }>();
      expect(`${table}:${row?.n}`).toBe(`${table}:0`);
    }
  });

  it("deletes the account of a user who never connected Strava", async () => {
    const userId = "user_delete_no_strava";
    await env.DB.prepare(`INSERT INTO users (id, timezone, created_at) VALUES (?, 'UTC', '')`)
      .bind(userId)
      .run();

    const res = await testApp().request(
      "/v1/account",
      { method: "DELETE", headers: { "x-test-user": userId } },
      env
    );
    expect(res.status).toBe(200);

    const row = await env.DB.prepare(`SELECT COUNT(*) AS n FROM users WHERE id = ?`)
      .bind(userId)
      .first<{ n: number }>();
    expect(row?.n).toBe(0);
  });

  it("still clears D1 rows when Strava rejects the deauthorization", async () => {
    const userId = "user_delete_strava_fails";
    await env.DB.prepare(`INSERT INTO users (id, timezone, created_at) VALUES (?, 'UTC', '')`)
      .bind(userId)
      .run();
    await env.DB.prepare(
      `INSERT INTO strava_connections (user_id, athlete_id, access_token_ciphertext, refresh_token_ciphertext, expires_at, status, connected_at)
       VALUES (?, 1001, ?, ?, ?, 'active', '')`
    )
      .bind(
        userId,
        await encryptSecret("access-tok", env.TOKEN_KEY),
        await encryptSecret("refresh-tok", env.TOKEN_KEY),
        Math.floor(Date.now() / 1000) + 3600
      )
      .run();

    const { fetchImpl } = makeFakeFetch([
      {
        match: (url) => url.endsWith("/oauth/deauthorize"),
        respond: () => jsonResponse(401, {}),
      },
    ]);

    const res = await testApp(fetchImpl).request(
      "/v1/account",
      { method: "DELETE", headers: { "x-test-user": userId } },
      env
    );
    expect(res.status).toBe(200);

    const row = await env.DB.prepare(
      `SELECT COUNT(*) AS n FROM strava_connections WHERE user_id = ?`
    )
      .bind(userId)
      .first<{ n: number }>();
    expect(row?.n).toBe(0);
  });

  it("reports 502 when the auth user cannot be removed", async () => {
    const userId = "user_delete_clerk_fails";
    await env.DB.prepare(`INSERT INTO users (id, timezone, created_at) VALUES (?, 'UTC', '')`)
      .bind(userId)
      .run();

    const res = await testApp(undefined, {
      deleteAuthUser: async () => {
        throw new Error("clerk down");
      },
    }).request("/v1/account", { method: "DELETE", headers: { "x-test-user": userId } }, env);
    expect(res.status).toBe(502);
  });

  it("starts the strava connect flow for any signed-in user", async () => {
    const res = await testApp().request(
      "/v1/connect/strava/start",
      { headers: { "x-test-user": "user_free" } },
      env
    );
    expect(res.status).toBe(200);
    const { url } = (await res.json()) as { url: string };
    expect(url).toContain("https://www.strava.com/oauth/authorize");
  });

  it("purges the account when Clerk reports a user.deleted webhook", async () => {
    const userId = "user_webhook_deleted";
    await env.DB.prepare(`INSERT INTO users (id, timezone, created_at) VALUES (?, 'UTC', '')`)
      .bind(userId)
      .run();
    await env.DB.prepare(
      `INSERT INTO strava_connections (user_id, athlete_id, access_token_ciphertext, refresh_token_ciphertext, expires_at, status, connected_at)
       VALUES (?, 2002, ?, ?, ?, 'active', '')`
    )
      .bind(
        userId,
        await encryptSecret("access-tok", env.TOKEN_KEY),
        await encryptSecret("refresh-tok", env.TOKEN_KEY),
        Math.floor(Date.now() / 1000) + 3600
      )
      .run();
    await env.DB.prepare(
      `INSERT INTO sessions (user_id, fingerprint, board, start_at, end_at, climb_count, top_grade, rpe, title, summary, climbs_json)
       VALUES (?, 'fp_hook', 'tension', '2025-01-01T00:00:00Z', '2025-01-01T01:00:00Z', 2, 4, 5, 't', 's', '[]')`
    )
      .bind(userId)
      .run();

    const { fetchImpl, calls } = makeFakeFetch([
      {
        match: (url, method) => url.endsWith("/oauth/deauthorize") && method === "POST",
        respond: () => jsonResponse(200, {}),
      },
    ]);

    const res = await testApp(fetchImpl, {
      verifyAuthWebhook: async () => ({ type: "user.deleted", userId, email: null }),
    }).request("/webhooks/clerk", { method: "POST", body: "{}" }, env);
    expect(res.status).toBe(200);

    expect(calls.some((c) => c.url.endsWith("/oauth/deauthorize"))).toBe(true);
    for (const table of ["users", "strava_connections", "sessions"]) {
      const column = table === "users" ? "id" : "user_id";
      const row = await env.DB.prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE ${column} = ?`)
        .bind(userId)
        .first<{ n: number }>();
      expect(`${table}:${row?.n}`).toBe(`${table}:0`);
    }
  });

  it("rejects a Clerk webhook that fails signature verification", async () => {
    const res = await testApp().request("/webhooks/clerk", { method: "POST", body: "{}" }, env);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "bad signature" });
  });

  it("ignores Clerk webhook events other than user.deleted", async () => {
    const userId = "user_webhook_ignored";
    await env.DB.prepare(`INSERT INTO users (id, timezone, created_at) VALUES (?, 'UTC', '')`)
      .bind(userId)
      .run();

    const res = await testApp(undefined, {
      verifyAuthWebhook: async () => ({ type: "user.updated", userId, email: null }),
    }).request("/webhooks/clerk", { method: "POST", body: "{}" }, env);
    expect(res.status).toBe(200);

    const row = await env.DB.prepare(`SELECT COUNT(*) AS n FROM users WHERE id = ?`)
      .bind(userId)
      .first<{ n: number }>();
    expect(row?.n).toBe(1);
  });

  it("is idempotent when the webhook arrives after our own deletion", async () => {
    const userId = "user_webhook_twice";
    await env.DB.prepare(`INSERT INTO users (id, timezone, created_at) VALUES (?, 'UTC', '')`)
      .bind(userId)
      .run();

    const first = await testApp().request(
      "/v1/account",
      { method: "DELETE", headers: { "x-test-user": userId } },
      env
    );
    expect(first.status).toBe(200);

    const second = await testApp(undefined, {
      verifyAuthWebhook: async () => ({ type: "user.deleted", userId, email: null }),
    }).request("/webhooks/clerk", { method: "POST", body: "{}" }, env);
    expect(second.status).toBe(200);
  });
});
