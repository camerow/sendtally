import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { app } from "../src/app";
import { reconcile, type Fields } from "../src/lib/areas";
import * as repo from "../src/lib/repo";
import { testApp } from "./harness";

const call = async (
  user: string,
  path: string,
  init: { method?: string; body?: unknown } = {}
): Promise<{ status: number; body: Record<string, unknown> }> => {
  const res = await testApp().request(
    path,
    {
      method: init.method ?? (init.body === undefined ? "GET" : "POST"),
      headers: { "x-test-user": user, "Content-Type": "application/json" },
      ...(init.body === undefined ? {} : { body: JSON.stringify(init.body) }),
    },
    env
  );
  return { status: res.status, body: (await res.json()) as Record<string, unknown> };
};

type Row = { id: string; slug: string; name: string; version: number; status: string };

const setRole = async (user: string, role: "user" | "moderator" | "admin"): Promise<void> => {
  await env.DB.prepare("INSERT OR IGNORE INTO users (id, created_at) VALUES (?, 'x')")
    .bind(user)
    .run();
  await env.DB.prepare("UPDATE users SET role = ? WHERE id = ?").bind(role, user).run();
};

const activate = async (table: "areas" | "area_climbs", id: string): Promise<void> => {
  await env.DB.prepare(`UPDATE ${table} SET status = 'active' WHERE id = ?`).bind(id).run();
};

const createArea = async (user: string, body: Record<string, unknown>): Promise<Row> => {
  const res = await call(user, "/v1/areas", { body: { confirmedNew: true, ...body } });
  expect(res.status).toBe(201);
  return res.body["area"] as Row;
};

const createClimb = async (user: string, areaId: string, name: string): Promise<Row> => {
  const res = await call(user, "/v1/area-climbs", {
    body: { areaId, name, type: "boulder", gradeScale: "v", grade: "V12", confirmedNew: true },
  });
  expect(res.status).toBe(201);
  return res.body["climb"] as Row;
};

const buttermilks = { parentId: "region-us-ca", name: "Buttermilks", lat: 37.327, lon: -118.577 };

const areaRow = (id: string) =>
  env.DB.prepare("SELECT path, depth, name, name_key, version, status FROM areas WHERE id = ?")
    .bind(id)
    .first<{
      path: string;
      depth: number;
      name: string;
      name_key: string;
      version: number;
      status: string;
    }>();

const revisionStatus = async (id: string): Promise<string | undefined> =>
  (
    await env.DB.prepare("SELECT status FROM content_revisions WHERE id = ?")
      .bind(id)
      .first<{ status: string }>()
  )?.status;

type Revision = {
  id: string;
  proposed: Fields;
  current: Fields;
  conflicts: Array<{ field: string }>;
};

const revisions = async (): Promise<Revision[]> =>
  (await call("mod", "/v1/moderation/revisions")).body["items"] as Revision[];

describe("moderation authorization", () => {
  it("answers 403 to a regular user on every moderation route", async () => {
    await setRole("user_a", "user");
    const routes = app.routes.filter(
      (r) => r.path.startsWith("/v1/moderation") && r.method !== "ALL"
    );
    expect(routes.length).toBeGreaterThanOrEqual(11);
    for (const route of routes) {
      const path = route.path.replace(/:[A-Za-z]+/g, "some-id");
      const res = await call("user_a", path, {
        method: route.method,
        ...(route.method === "GET" ? {} : { body: { version: 1 } }),
      });
      expect([route.method, route.path, res.status]).toEqual([route.method, route.path, 403]);
    }
    expect((await call("nobody", "/v1/moderation/queue")).status).toBe(403);
  });

  it("lets moderators and admins through", async () => {
    await setRole("mod", "moderator");
    await setRole("boss", "admin");
    expect((await call("mod", "/v1/moderation/queue")).status).toBe(200);
    expect((await call("boss", "/v1/moderation/queue")).status).toBe(200);
  });

  it("tells the client its role, so it can show the moderation entry", async () => {
    await setRole("mod-status", "moderator");
    expect((await call("mod-status", "/v1/status")).body["role"]).toBe("moderator");
    expect((await call("nobody-yet", "/v1/status")).body["role"]).toBe("user");
  });
});

describe("moderating creations", () => {
  it("approves an area before its climbs, at the version reviewed", async () => {
    await setRole("mod", "moderator");
    const area = await createArea("user_a", buttermilks);
    const climb = await createClimb("user_a", area.id, "The Mandala");

    const queue = await call("mod", "/v1/moderation/queue");
    expect(queue.body["creations"]).toMatchObject({ count: 2 });

    const early = await call("mod", `/v1/moderation/climbs/${climb.id}/approve`, {
      body: { version: 1 },
    });
    expect(early.status).toBe(409);

    await call("user_a", `/v1/areas/${area.id}`, {
      method: "PUT",
      body: { name: "The Buttermilks", lat: 37.327, lon: -118.577 },
    });
    const stale = await call("mod", `/v1/moderation/areas/${area.id}/approve`, {
      body: { version: 1 },
    });
    expect(stale.status).toBe(409);
    const approved = await call("mod", `/v1/moderation/areas/${area.id}/approve`, {
      body: { version: 2 },
    });
    expect(approved.status).toBe(200);
    expect(approved.body["area"]).toMatchObject({ status: "active", version: 3 });

    expect(
      (await call("mod", `/v1/moderation/climbs/${climb.id}/approve`, { body: { version: 1 } }))
        .status
    ).toBe(200);
    expect((await call("user_b", "/v1/area-climbs/the-mandala")).status).toBe(200);
    expect(
      (await call("mod", `/v1/moderation/areas/${area.id}/approve`, { body: { version: 3 } }))
        .status
    ).toBe(409);
  });

  it("lists pending creations with their duplicate candidates", async () => {
    await setRole("mod", "moderator");
    const area = await createArea("user_a", buttermilks);
    await activate("areas", area.id);
    const live = await createClimb("user_a", area.id, "The Mandala");
    await activate("area_climbs", live.id);
    const dup = await createClimb("user_b", area.id, "Mandala");

    const res = await call("mod", "/v1/moderation/creations");
    const items = res.body["items"] as Array<{ climb?: Row; candidates: Row[] }>;
    expect(items.map((i) => i.climb?.id)).toEqual([dup.id]);
    expect(items[0]?.candidates.map((c) => c.id)).toEqual([live.id]);
  });

  it("rejects a climb, dropping its session links, and an area only once it is empty", async () => {
    await setRole("mod", "moderator");
    const area = await createArea("user_a", buttermilks);
    const climb = await createClimb("user_a", area.id, "The Mandala");
    const session = await call("user_a", "/v1/sessions", {
      body: {
        date: "2026-09-12",
        location: "outdoor",
        climbs: [{ name: "The Mandala", climbId: climb.id, grade: { scale: "v", value: 12 } }],
      },
    });
    expect(session.status).toBe(201);
    const links = (): Promise<{ n: number } | null> =>
      env.DB.prepare("SELECT count(*) AS n FROM session_climb_links WHERE climb_id = ?")
        .bind(climb.id)
        .first<{ n: number }>();
    expect((await links())?.n).toBe(1);

    const blocked = await call("mod", `/v1/moderation/areas/${area.id}/reject`, { body: {} });
    expect(blocked.status).toBe(409);

    const rejected = await call("mod", `/v1/moderation/climbs/${climb.id}/reject`, {
      body: { note: "Not a real problem" },
    });
    expect(rejected.status).toBe(200);
    expect((await links())?.n).toBe(0);
    expect((await call("user_a", "/v1/area-climbs/the-mandala")).status).toBe(404);

    const empty = await call("mod", `/v1/moderation/areas/${area.id}/reject`, { body: {} });
    expect(empty.status).toBe(200);
    expect((await areaRow(area.id))?.status).toBe("deleted");
  });
});

describe("moderating revisions", () => {
  const liveClimb = async (): Promise<{ area: Row; climb: Row }> => {
    await setRole("mod", "moderator");
    const area = await createArea("user_a", buttermilks);
    const climb = await createClimb("user_a", area.id, "The Mandala");
    await activate("areas", area.id);
    await activate("area_climbs", climb.id);
    return { area, climb };
  };

  const suggest = (user: string, path: string, body: Record<string, unknown>) =>
    call(user, `${path}/draft`, { method: "PUT", body });

  it("applies a revision's fields and bumps the version", async () => {
    const { climb } = await liveClimb();
    await suggest("user_b", `/v1/area-climbs/${climb.id}`, {
      name: "Mandala Direct",
      grade: "V13",
    });
    const [revision] = await revisions();
    expect(revision?.conflicts).toEqual([]);

    const res = await call("mod", `/v1/moderation/revisions/${revision?.id}/approve`, {
      body: { version: 1 },
    });
    expect(res.status).toBe(200);
    expect(res.body["climb"]).toMatchObject({
      name: "Mandala Direct",
      grade_value: "V13",
      slug: "the-mandala",
      version: 2,
    });
    const key = await env.DB.prepare("SELECT name_key FROM area_climbs WHERE id = ?")
      .bind(climb.id)
      .first<{ name_key: string }>();
    expect(key?.name_key).toBe("mandala-direct");
    expect(await revisionStatus(revision?.id ?? "")).toBe("approved");
    expect(await revisions()).toEqual([]);
  });

  it("answers 409 on a conflict, then applies the moderator's pick", async () => {
    const { climb } = await liveClimb();
    const path = `/v1/area-climbs/${climb.id}`;
    await suggest("user_b", path, { name: "Mandala Direct" });
    await suggest("user_c", path, { name: "The Mandala Sit", firstAscent: "Chris Sharma, 2000" });
    const pending = await revisions();
    const first = pending.find((r) => r.proposed["name"] === "Mandala Direct");
    const second = pending.find((r) => r.proposed["name"] === "The Mandala Sit");
    await call("mod", `/v1/moderation/revisions/${first?.id}/approve`, { body: { version: 1 } });

    const [listed] = await revisions();
    expect(listed?.conflicts.map((c) => c.field)).toEqual(["name"]);

    const approve = (body: Record<string, unknown>) =>
      call("mod", `/v1/moderation/revisions/${second?.id}/approve`, { body });
    const conflict = await approve({ version: 2 });
    expect(conflict.status).toBe(409);
    expect(conflict.body["conflicts"]).toEqual([
      {
        field: "name",
        base: "The Mandala",
        proposed: "The Mandala Sit",
        current: "Mandala Direct",
      },
    ]);

    const stray = await approve({ version: 2, resolutions: { bolts: 3 } });
    expect(stray.status).toBe(400);
    const stale = await approve({ version: 1, resolutions: { name: "The Mandala Sit" } });
    expect(stale.status).toBe(409);

    const resolved = await approve({ version: 2, resolutions: { name: "The Mandala Sit" } });
    expect(resolved.status).toBe(200);
    expect(resolved.body["climb"]).toMatchObject({
      name: "The Mandala Sit",
      first_ascent: "Chris Sharma, 2000",
      version: 3,
    });
  });

  it("changes nothing when the entity moved on between read and batch", async () => {
    const { climb } = await liveClimb();
    await suggest("user_b", `/v1/area-climbs/${climb.id}`, { grade: "V13" });
    const [revision] = await revisions();
    await env.DB.prepare("UPDATE area_climbs SET version = 2 WHERE id = ?").bind(climb.id).run();

    const row = await repo.getAreaClimb(env.DB, { id: "mod", role: "moderator" }, climb.id);
    if (row === null) throw new Error("missing climb");
    const { id: _id, slug: _slug, status: _status, version: _version, ...rest } = row;
    const applied = await repo.approveAreaClimbRevision(env.DB, {
      revisionId: revision?.id ?? "",
      reviewerId: "mod",
      id: climb.id,
      version: 1,
      write: { ...rest, grade_value: "V13" },
    });
    expect(applied).toBe(false);
    expect(await revisionStatus(revision?.id ?? "")).toBe("pending");
    const grade = await env.DB.prepare("SELECT grade_value FROM area_climbs WHERE id = ?")
      .bind(climb.id)
      .first<{ grade_value: string }>();
    expect(grade?.grade_value).toBe("V12");
  });

  it("re-parents an area and rewrites the paths of its whole subtree", async () => {
    const { area } = await liveClimb();
    const sector = await createArea("user_a", { parentId: area.id, name: "Get Carter" });
    await activate("areas", sector.id);
    const bishop = await createArea("user_a", { ...buttermilks, name: "Bishop", lat: 37.5 });
    await activate("areas", bishop.id);
    const bishopPath = (await areaRow(bishop.id))?.path ?? "";

    await suggest("user_b", `/v1/areas/${area.id}`, { parentId: bishop.id });
    const [revision] = await revisions();
    const res = await call("mod", `/v1/moderation/revisions/${revision?.id}/approve`, {
      body: { version: 1 },
    });
    expect(res.status).toBe(200);

    expect(await areaRow(area.id)).toMatchObject({
      path: `${bishopPath}${area.id}/`,
      depth: 3,
      version: 2,
    });
    expect(await areaRow(sector.id)).toMatchObject({
      path: `${bishopPath}${area.id}/${sector.id}/`,
      depth: 4,
      version: 1,
    });
    const found = await call("user_b", `/v1/area-climbs?areaId=${bishop.id}`);
    expect((found.body["climbs"] as Row[]).map((c) => c.name)).toEqual(["The Mandala"]);
  });

  it("refuses a re-parent whose target is no longer live", async () => {
    const { area } = await liveClimb();
    const bishop = await createArea("user_a", { ...buttermilks, name: "Bishop", lat: 37.5 });
    await activate("areas", bishop.id);
    await suggest("user_b", `/v1/areas/${area.id}`, { parentId: bishop.id });
    await env.DB.prepare("UPDATE areas SET status = 'deleted' WHERE id = ?").bind(bishop.id).run();
    const [revision] = await revisions();
    const res = await call("mod", `/v1/moderation/revisions/${revision?.id}/approve`, {
      body: { version: 1 },
    });
    expect(res.status).toBe(409);
    expect(await revisionStatus(revision?.id ?? "")).toBe("pending");
  });

  it("rejects a revision with a note", async () => {
    const { climb } = await liveClimb();
    await suggest("user_b", `/v1/area-climbs/${climb.id}`, { grade: "V3" });
    const [revision] = await revisions();
    const res = await call("mod", `/v1/moderation/revisions/${revision?.id}/reject`, {
      body: { note: "Guidebook says V12" },
    });
    expect(res.status).toBe(200);
    expect(await revisionStatus(revision?.id ?? "")).toBe("rejected");
    const again = await call("mod", `/v1/moderation/revisions/${revision?.id}/reject`, {
      body: {},
    });
    expect(again.status).toBe(409);
  });
});

describe("account deletion", () => {
  const count = async (query: string, ...binds: string[]): Promise<number> =>
    (
      await env.DB.prepare(`SELECT COUNT(*) AS n FROM ${query}`)
        .bind(...binds)
        .first<{ n: number }>()
    )?.n ?? -1;

  const deleteAccount = async (user: string): Promise<void> => {
    const res = await testApp().request(
      "/v1/account",
      { method: "DELETE", headers: { "x-test-user": user } },
      env
    );
    expect(res.status).toBe(200);
  };

  it("keeps approved contributions without their author and drops the rest", async () => {
    await setRole("mod", "moderator");
    const area = await createArea("user_a", buttermilks);
    const climb = await createClimb("user_a", area.id, "The Mandala");
    const approve = (path: string, version: number) =>
      call("mod", `/v1/moderation/${path}/approve`, { body: { version } });
    expect((await approve(`areas/${area.id}`, 1)).status).toBe(200);
    expect((await approve(`climbs/${climb.id}`, 1)).status).toBe(200);

    await call("user_a", `/v1/area-climbs/${climb.id}/draft`, {
      method: "PUT",
      body: { grade: "V13" },
    });
    const [revision] = await revisions();
    expect(
      (
        await call("mod", `/v1/moderation/revisions/${revision?.id}/approve`, {
          body: { version: 2 },
        })
      ).status
    ).toBe(200);

    const pending = await createClimb("user_a", area.id, "Mandala Sit");
    await call("user_a", `/v1/areas/${area.id}/draft`, {
      method: "PUT",
      body: { name: "The Buttermilks", lat: 37.327, lon: -118.577 },
    });
    expect(
      (
        await call("user_a", `/v1/area-climbs/${pending.id}/duplicate-reports`, {
          body: { keepClimbId: climb.id },
        })
      ).status
    ).toBe(201);
    expect(
      (
        await call("user_a", "/v1/areas/reports", {
          body: { entityType: "climb", entityId: climb.id, body: "Grade is off" },
        })
      ).status
    ).toBe(201);

    const outer = await createArea("user_a", { ...buttermilks, name: "Happy Boulders" });
    const inner = await createArea("user_a", { parentId: outer.id, name: "Central Canyon" });
    const shared = await createArea("user_a", { ...buttermilks, name: "Sad Boulders" });
    const modClimb = await createClimb("mod", shared.id, "Ketron Classic");

    const logged = await call("user_b", "/v1/sessions", {
      body: {
        date: "2026-09-12",
        location: "outdoor",
        areaId: area.id,
        climbs: [{ name: "The Mandala", climbId: climb.id, grade: { scale: "v", value: 12 } }],
      },
    });
    expect(logged.status).toBe(201);

    await deleteAccount("user_a");

    const kept = await env.DB.prepare(
      `SELECT id, status, created_by FROM areas WHERE id IN (?, ?)
       UNION ALL SELECT id, status, created_by FROM area_climbs WHERE id IN (?, ?)`
    )
      .bind(area.id, shared.id, climb.id, modClimb.id)
      .all<{ id: string; status: string; created_by: string | null }>();
    expect(Object.fromEntries(kept.results.map((r) => [r.id, [r.status, r.created_by]]))).toEqual({
      [area.id]: ["active", null],
      [shared.id]: ["pending", null],
      [climb.id]: ["active", null],
      [modClimb.id]: ["pending", "mod"],
    });
    for (const id of [pending.id, outer.id, inner.id]) {
      expect(
        await count("(SELECT id FROM areas UNION ALL SELECT id FROM area_climbs) WHERE id = ?", id)
      ).toBe(0);
    }
    expect(
      await count("session_climb_links WHERE user_id = 'user_b' AND climb_id = ?", climb.id)
    ).toBe(1);
    expect(await count("content_revisions WHERE status = 'pending'")).toBe(0);
    const audit = await env.DB.prepare(
      "SELECT status, submitted_by, reviewed_by, proposed_json FROM content_revisions WHERE id = ?"
    )
      .bind(revision?.id ?? "")
      .first<{
        status: string;
        submitted_by: string | null;
        reviewed_by: string | null;
        proposed_json: string;
      }>();
    expect(audit).toMatchObject({ status: "approved", submitted_by: null, reviewed_by: "mod" });
    expect(JSON.parse(audit?.proposed_json ?? "{}")).toMatchObject({ grade_value: "V13" });
    expect(await count("duplicate_reports")).toBe(0);
    expect(await count("content_reports")).toBe(0);
    expect(await count("users WHERE id = 'user_a'")).toBe(0);

    await deleteAccount("mod");
    expect(
      await count("content_revisions WHERE reviewed_by IS NULL AND id = ?", revision?.id ?? "")
    ).toBe(1);
    expect(await count("area_climbs WHERE id = ?", modClimb.id)).toBe(0);
    expect(await count("areas WHERE id = ?", shared.id)).toBe(1);
  });
});

describe("issue reports", () => {
  it("takes a report on something the user can see and lets a moderator resolve it", async () => {
    await setRole("mod", "moderator");
    const area = await createArea("user_a", buttermilks);
    const report = { entityType: "area", entityId: area.id, body: "Wrong coordinates" };
    expect((await call("user_b", "/v1/areas/reports", { body: report })).status).toBe(404);
    await activate("areas", area.id);
    expect((await call("user_b", "/v1/areas/reports", { body: report })).status).toBe(201);

    const listed = await call("mod", "/v1/moderation/reports");
    const items = listed.body["items"] as Array<{ id: string; entity: { slug: string } }>;
    expect(listed.body["count"]).toBe(1);
    expect(items[0]?.entity.slug).toBe("buttermilks");

    const resolve = () =>
      call("mod", `/v1/moderation/reports/${items[0]?.id}/resolve`, { body: {} });
    expect((await resolve()).status).toBe(200);
    expect((await resolve()).status).toBe(404);
    expect((await call("mod", "/v1/moderation/queue")).body["reports"]).toEqual({
      count: 0,
      items: [],
    });
  });
});

describe("duplicate climbs", () => {
  const liveClimbs = async (...names: string[]): Promise<{ area: Row; ids: string[] }> => {
    await setRole("mod", "moderator");
    const area = await createArea("user_a", buttermilks);
    await activate("areas", area.id);
    const ids: string[] = [];
    for (const name of names) {
      const climb = await createClimb("user_a", area.id, name);
      await activate("area_climbs", climb.id);
      ids.push(climb.id);
    }
    return { area, ids };
  };

  const logSend = async (user: string, areaId: string, climbId: string): Promise<string> => {
    const res = await call(user, "/v1/sessions", {
      body: {
        date: "2026-09-12",
        location: "outdoor",
        areaId,
        climbs: [{ name: "Mandala", climbId, grade: { scale: "v", value: 12 } }],
      },
    });
    expect(res.status).toBe(201);
    return (res.body["session"] as { fingerprint: string }).fingerprint;
  };

  const linkOf = async (user: string, fingerprint: string): Promise<unknown> =>
    (
      (await call(user, `/v1/sessions/${fingerprint}`)).body["session"] as {
        climbs: Array<{ link: unknown }>;
      }
    ).climbs[0]?.link;

  const report = (user: string, duplicateId: string, keepClimbId: string) =>
    call(user, `/v1/area-climbs/${duplicateId}/duplicate-reports`, { body: { keepClimbId } });

  const mergedInto = async (id: string): Promise<string | null | undefined> =>
    (
      await env.DB.prepare(
        "SELECT merged_into_id FROM area_climbs WHERE id = ? AND status = 'merged'"
      )
        .bind(id)
        .first<{ merged_into_id: string | null }>()
    )?.merged_into_id;

  const reportStatuses = async (): Promise<string[]> =>
    (
      await env.DB.prepare("SELECT status FROM duplicate_reports ORDER BY created_at, id").all<{
        status: string;
      }>()
    ).results.map((r) => r.status);

  type Side = { id: string; slug: string; links: number };
  type Duplicate = { id: string; keep: Side; duplicate: Side };

  const duplicates = async (): Promise<Duplicate[]> =>
    (await call("mod", "/v1/moderation/duplicates")).body["items"] as Duplicate[];

  const merge = (id: string, body: Record<string, unknown> = {}) =>
    call("mod", `/v1/moderation/duplicates/${id}/merge`, { body });

  it("takes one open report per reporter per duplicate, on open climbs only", async () => {
    const {
      area,
      ids: [keep = "", dup = ""],
    } = await liveClimbs("The Mandala", "Mandala");
    const hidden = await createClimb("user_b", area.id, "Mandala Sit");

    expect((await report("user_b", dup, keep)).status).toBe(201);
    expect((await report("user_b", dup, keep)).status).toBe(409);
    expect((await report("user_c", dup, keep)).status).toBe(201);
    expect((await report("user_b", dup, dup)).status).toBe(400);
    expect((await report("user_c", hidden.id, keep)).status).toBe(404);
    expect((await report("user_b", dup, "nope")).status).toBe(404);

    const queue = await call("mod", "/v1/moderation/queue");
    expect(queue.body["duplicates"]).toMatchObject({ count: 2 });
  });

  it("moves every user's links to the survivor and closes the paperwork", async () => {
    const {
      area,
      ids: [keep = "", dup = ""],
    } = await liveClimbs("The Mandala", "Mandala");
    const first = await logSend("user_a", area.id, dup);
    const second = await logSend("user_b", area.id, dup);
    await logSend("user_c", area.id, keep);
    await call("user_b", `/v1/area-climbs/${dup}/draft`, { method: "PUT", body: { grade: "V13" } });
    await report("user_b", dup, keep);
    await report("user_c", dup, keep);

    const [item] = await duplicates();
    expect(item?.keep).toMatchObject({ id: keep, links: 1 });
    expect(item?.duplicate).toMatchObject({ id: dup, links: 2 });

    const res = await merge(item?.id ?? "");
    expect(res.status).toBe(200);
    expect(res.body["climb"]).toMatchObject({ id: keep, status: "active", version: 1 });

    const survivor = { id: keep, name: "The Mandala", slug: "the-mandala" };
    expect(await linkOf("user_a", first)).toEqual(survivor);
    expect(await linkOf("user_b", second)).toEqual(survivor);
    expect(await mergedInto(dup)).toBe(keep);
    expect(await revisions()).toEqual([]);
    expect(await reportStatuses()).toEqual(["merged", "merged"]);
    expect(await duplicates()).toEqual([]);
    expect((await call("user_b", "/v1/area-climbs/mandala")).body).toEqual({
      redirect: "the-mandala",
    });
    expect((await merge(item?.id ?? "")).status).toBe(409);
  });

  it("repoints earlier merges so redirects never chain", async () => {
    const {
      area,
      ids: [a = "", b = "", c = ""],
    } = await liveClimbs("Mandala", "The Mandala", "Mandala Stand");
    const send = await logSend("user_b", area.id, a);
    const into = (dup: string, keep: string) =>
      call("mod", `/v1/moderation/climbs/${dup}/merge-into/${keep}`, { method: "POST" });

    expect((await into(a, b)).status).toBe(200);
    expect((await into(b, c)).status).toBe(200);
    expect(await mergedInto(a)).toBe(c);
    expect(await mergedInto(b)).toBe(c);
    expect((await call("user_b", "/v1/area-climbs/mandala")).body).toEqual({
      redirect: "mandala-stand",
    });
    expect(await linkOf("user_b", send)).toMatchObject({ id: c });
    expect((await into(c, a)).status).toBe(409);
  });

  it("lets the moderator keep the reported duplicate instead", async () => {
    const {
      ids: [keep = "", dup = ""],
    } = await liveClimbs("The Mandala", "Mandala");
    await report("user_b", dup, keep);
    const [item] = await duplicates();

    const res = await merge(item?.id ?? "", { swap: true });
    expect(res.body["climb"]).toMatchObject({ id: dup });
    expect(await mergedInto(keep)).toBe(dup);
    expect(await reportStatuses()).toEqual(["merged"]);
  });

  it("merges a pending creation into a live climb, keeping the creator's send", async () => {
    const {
      area,
      ids: [keep = ""],
    } = await liveClimbs("The Mandala");
    const pending = await createClimb("user_b", area.id, "Mandala");
    const send = await logSend("user_b", area.id, pending.id);

    const res = await call("mod", `/v1/moderation/climbs/${pending.id}/merge-into/${keep}`, {
      method: "POST",
    });
    expect(res.status).toBe(200);
    expect(await linkOf("user_b", send)).toMatchObject({ id: keep, slug: "the-mandala" });
    expect((await call("mod", "/v1/moderation/creations")).body["count"]).toBe(0);
  });

  it("changes nothing when the survivor was merged away first", async () => {
    const {
      area,
      ids: [keep = "", dup = "", other = ""],
    } = await liveClimbs("The Mandala", "Mandala", "Mandala Sit");
    const send = await logSend("user_b", area.id, dup);
    await report("user_b", dup, keep);
    await call("mod", `/v1/moderation/climbs/${keep}/merge-into/${other}`, { method: "POST" });

    const stale = { duplicateId: dup, keepId: keep, reviewerId: "mod" };
    expect(await repo.mergeAreaClimb(env.DB, stale)).toBe(false);
    expect(await linkOf("user_b", send)).toMatchObject({ id: dup });
    expect(await mergedInto(dup)).toBeUndefined();
    expect(await reportStatuses()).toEqual(["open"]);

    const [item] = await duplicates();
    expect(item?.keep.id).toBe(other);
    expect((await merge(item?.id ?? "")).status).toBe(200);
    expect(await linkOf("user_b", send)).toMatchObject({ id: other });
  });

  it("dismisses a report once", async () => {
    const {
      ids: [keep = "", dup = ""],
    } = await liveClimbs("The Mandala", "Mandala");
    await report("user_b", dup, keep);
    const [item] = await duplicates();
    const dismiss = () =>
      call("mod", `/v1/moderation/duplicates/${item?.id}/dismiss`, { body: { note: "Different" } });
    expect((await dismiss()).status).toBe(200);
    expect((await dismiss()).status).toBe(404);
    expect(await reportStatuses()).toEqual(["dismissed"]);
    expect((await report("user_b", dup, keep)).status).toBe(201);
  });
});

describe("reconcile", () => {
  const base = { name: "The Mandala", grade_value: "V12", bolts: null };
  const cases: Array<{
    name: string;
    proposed: Fields;
    current: Fields;
    resolutions?: Fields;
    apply: Fields;
    conflicts: string[];
  }> = [
    {
      name: "applies a field nobody else touched",
      proposed: { grade_value: "V13" },
      current: base,
      apply: { grade_value: "V13" },
      conflicts: [],
    },
    {
      name: "skips a field someone else already set to the same value",
      proposed: { grade_value: "V13" },
      current: { ...base, grade_value: "V13" },
      apply: {},
      conflicts: [],
    },
    {
      name: "flags a field changed both ways",
      proposed: { grade_value: "V13" },
      current: { ...base, grade_value: "V11" },
      apply: {},
      conflicts: ["grade_value"],
    },
    {
      name: "checks each field on its own",
      proposed: { name: "Mandala", grade_value: "V13" },
      current: { ...base, grade_value: "V11" },
      apply: { name: "Mandala" },
      conflicts: ["grade_value"],
    },
    {
      name: "treats null as a value",
      proposed: { bolts: 4 },
      current: { ...base, bolts: 2 },
      apply: {},
      conflicts: ["bolts"],
    },
    {
      name: "takes the moderator's pick over a conflict",
      proposed: { grade_value: "V13" },
      current: { ...base, grade_value: "V11" },
      resolutions: { grade_value: "V11" },
      apply: { grade_value: "V11" },
      conflicts: [],
    },
    {
      name: "lets a pick override a clean field too",
      proposed: { grade_value: "V13" },
      current: base,
      resolutions: { grade_value: null },
      apply: { grade_value: null },
      conflicts: [],
    },
  ];

  it.each(cases)("$name", ({ proposed, current, resolutions, apply, conflicts }) => {
    const result = reconcile(base, proposed, current, resolutions);
    expect(result.apply).toEqual(apply);
    expect(result.conflicts.map((c) => c.field)).toEqual(conflicts);
  });
});
