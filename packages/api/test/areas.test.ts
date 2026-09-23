import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { testApp } from "./harness";

const as = (user: string) => ({ "x-test-user": user, "Content-Type": "application/json" });

const call = async (
  user: string,
  path: string,
  init: { method?: string; body?: unknown } = {}
): Promise<{ status: number; body: Record<string, unknown> }> => {
  const res = await testApp().request(
    path,
    {
      method: init.method ?? (init.body === undefined ? "GET" : "POST"),
      headers: as(user),
      ...(init.body === undefined ? {} : { body: JSON.stringify(init.body) }),
    },
    env
  );
  return { status: res.status, body: (await res.json()) as Record<string, unknown> };
};

type Row = { id: string; slug: string; name: string };

const buttermilks = {
  parentId: "region-us-ca",
  name: "Buttermilks",
  lat: 37.327,
  lon: -118.577,
};

const createArea = async (user: string, body: Record<string, unknown>): Promise<Row> => {
  const res = await call(user, "/v1/areas", { body });
  expect(res.status).toBe(201);
  return res.body["area"] as Row;
};

const createClimb = async (user: string, body: Record<string, unknown>): Promise<Row> => {
  const res = await call(user, "/v1/area-climbs", { body });
  expect(res.status).toBe(201);
  return res.body["climb"] as Row;
};

const mandala = (areaId: string): Record<string, unknown> => ({
  areaId,
  name: "The Mandala",
  type: "boulder",
  gradeScale: "v",
  grade: "V12",
});

describe("areas", () => {
  it("keeps a pending area and climb to their creator", async () => {
    const area = await createArea("user_a", buttermilks);
    expect(area).toMatchObject({ slug: "buttermilks", status: "pending", mine: true });
    const climb = await createClimb("user_a", mandala(area.id));
    expect(climb).toMatchObject({ slug: "the-mandala", grade_value: "V12", status: "pending" });

    const own = await call("user_a", "/v1/areas/buttermilks");
    expect(own.status).toBe(200);
    expect((own.body["ancestors"] as Row[]).map((a) => a.slug)).toEqual([
      "united-states",
      "california",
    ]);
    expect((own.body["climbs"] as Row[]).map((c) => c.slug)).toEqual(["the-mandala"]);
    const ownClimb = await call("user_a", "/v1/area-climbs/the-mandala");
    expect((ownClimb.body["ancestors"] as Row[]).map((a) => a.slug)).toEqual([
      "united-states",
      "california",
      "buttermilks",
    ]);

    expect((await call("user_b", "/v1/areas/buttermilks")).status).toBe(404);
    expect((await call("user_b", "/v1/area-climbs/the-mandala")).status).toBe(404);
    expect((await call("user_b", "/v1/areas?q=butter")).body["areas"]).toEqual([]);
    expect((await call("user_b", "/v1/area-climbs?q=mandala")).body["climbs"]).toEqual([]);
    const nearby = await call("user_b", "/v1/areas?near=37.33,-118.58");
    expect(nearby.body["areas"]).toEqual([]);

    const found = await call("user_a", "/v1/areas?q=butter");
    expect((found.body["areas"] as Row[]).map((a) => a.id)).toEqual([area.id]);
    const climbs = await call("user_a", `/v1/area-climbs?areaId=region-us`);
    expect((climbs.body["climbs"] as Row[]).map((c) => c.id)).toEqual([climb.id]);
  });

  it("searches inside a picked area first and carries each hit's ancestors", async () => {
    const crag = await createArea("user_a", buttermilks);
    const sector = await createArea("user_a", {
      parentId: crag.id,
      name: "Peabody Boulders",
      confirmedNew: true,
    });
    const elsewhere = await createArea("user_a", {
      parentId: "region-us-ca",
      name: "Peabody Ridge",
      lat: 38.1,
      lon: -119.2,
      confirmedNew: true,
    });

    const children = await call("user_a", `/v1/areas?within=${crag.id}`);
    expect((children.body["areas"] as Row[]).map((a) => a.id)).toEqual([sector.id]);

    const found = await call("user_a", `/v1/areas?q=peab&within=${crag.id}`);
    const hits = found.body["areas"] as Array<Row & { ancestors: Row[] }>;
    expect(hits.map((a) => a.id)).toEqual([sector.id, elsewhere.id]);
    expect(hits[0]?.ancestors.map((a) => a.slug)).toEqual([
      "united-states",
      "california",
      "buttermilks",
    ]);

    expect((await call("user_b", `/v1/areas?within=${crag.id}`)).body["areas"]).toEqual([]);
  });

  it("lets only the creator edit a pending area, keeping its slug", async () => {
    const area = await createArea("user_a", buttermilks);
    const edit = { name: "The Buttermilks", lat: 37.33, lon: -118.58 };
    expect(
      (await call("user_b", `/v1/areas/${area.id}`, { method: "PUT", body: edit })).status
    ).toBe(404);
    const edited = await call("user_a", `/v1/areas/${area.id}`, { method: "PUT", body: edit });
    expect(edited.body["area"]).toMatchObject({ name: "The Buttermilks", slug: "buttermilks" });
    const noCoords = await call("user_a", `/v1/areas/${area.id}`, {
      method: "PUT",
      body: { name: "The Buttermilks" },
    });
    expect(noCoords.status).toBe(400);
  });

  it("answers 409 with candidates for a near-identical name unless confirmed", async () => {
    const area = await createArea("user_a", buttermilks);
    const climb = await createClimb("user_a", mandala(area.id));

    const similar = await call("user_a", "/v1/area-climbs/similar", {
      body: { areaId: area.id, name: "Mandala" },
    });
    expect((similar.body["candidates"] as Row[]).map((c) => c.id)).toEqual([climb.id]);

    const again = await call("user_a", "/v1/area-climbs", {
      body: { ...mandala(area.id), name: "The Mandala!" },
    });
    expect(again.status).toBe(409);
    expect((again.body["candidates"] as Row[]).map((c) => c.id)).toEqual([climb.id]);

    const nearbyArea = await call("user_a", "/v1/areas", {
      body: { ...buttermilks, parentId: "region-us", name: "Buttermilk" },
    });
    expect(nearbyArea.status).toBe(409);
    expect((nearbyArea.body["candidates"] as Row[]).map((a) => a.id)).toEqual([area.id]);
  });

  it("qualifies a colliding slug with the parent, then numbers it", async () => {
    const bishop = await createArea("user_a", { ...buttermilks, name: "Bishop", lat: 37.36 });
    const sector = await createArea("user_a", { parentId: bishop.id, name: "Buttermilks" });
    expect(sector.slug).toBe("buttermilks");
    const other = await createArea("user_a", {
      parentId: "region-fr",
      name: "Buttermilks",
      lat: 48.4,
      lon: 2.6,
    });
    expect(other.slug).toBe("buttermilks-france");
    const third = await createArea("user_a", {
      parentId: "region-fr",
      name: "Buttermilks",
      lat: 44.4,
      lon: 5.6,
      confirmedNew: true,
    });
    expect(third.slug).toBe("buttermilks-france-2");

    const first = await createClimb("user_a", mandala(sector.id));
    const second = await createClimb("user_a", { ...mandala(other.id) });
    expect([first.slug, second.slug]).toEqual(["the-mandala", "the-mandala-buttermilks-france"]);
  });

  it("never lets a user create a region or an uncoordinated top-level area", async () => {
    const noParent = await call("user_a", "/v1/areas", {
      body: { name: "Atlantis", lat: 0, lon: 0 },
    });
    expect(noParent.status).toBe(400);
    const noCoords = await call("user_a", "/v1/areas", {
      body: { parentId: "region-us-ca", name: "Buttermilks" },
    });
    expect(noCoords.status).toBe(400);
    const inRegion = await call("user_a", "/v1/area-climbs", { body: mandala("region-us-ca") });
    expect(inRegion.status).toBe(400);
  });

  it("rejects a grade scale that does not fit the climb type", async () => {
    const area = await createArea("user_a", buttermilks);
    const routeOnV = await call("user_a", "/v1/area-climbs", {
      body: { ...mandala(area.id), type: "sport" },
    });
    expect(routeOnV.status).toBe(400);
    const badGrade = await call("user_a", "/v1/area-climbs", {
      body: { ...mandala(area.id), type: "sport", gradeScale: "yds", grade: "5.99z" },
    });
    expect(badGrade.status).toBe(400);
  });

  it("shows moderators everyone's pending content", async () => {
    await createArea("user_a", buttermilks);
    await env.DB.prepare(
      "INSERT INTO users (id, created_at, role) VALUES ('mod', 'x', 'moderator')"
    ).run();
    expect((await call("mod", "/v1/areas/buttermilks")).status).toBe(200);
  });
});

describe("session links", () => {
  const session = (areaId: string, climbId: string): Record<string, unknown> => ({
    date: "2026-09-12",
    location: "outdoor",
    areaId,
    climbs: [
      { name: "The Mandala", climbId, grade: { scale: "v", value: 12 } },
      { name: "Warm up", grade: { scale: "v", value: 3 } },
    ],
  });

  type Linked = { area: Row | null; climbs: Array<{ name: string; link: Row | null }> };

  const read = async (user: string, fingerprint: string): Promise<Linked> =>
    (await call(user, `/v1/sessions/${fingerprint}`)).body["session"] as Linked;

  const linkCount = async (fingerprint: string): Promise<number> =>
    (
      await env.DB.prepare("SELECT count(*) AS n FROM session_climb_links WHERE fingerprint = ?")
        .bind(fingerprint)
        .first<{ n: number }>()
    )?.n ?? 0;

  it("links a send on the user's own pending climb and crag", async () => {
    const area = await createArea("user_a", buttermilks);
    const climb = await createClimb("user_a", mandala(area.id));
    const res = await call("user_a", "/v1/sessions", { body: session(area.id, climb.id) });
    expect(res.status).toBe(201);
    const fingerprint = (res.body["session"] as { fingerprint: string }).fingerprint;

    const linked = await read("user_a", fingerprint);
    expect(linked.area).toEqual({
      id: area.id,
      name: "Buttermilks",
      slug: "buttermilks",
      trail: [],
    });
    expect(linked.climbs.map((c) => c.link)).toEqual([
      { id: climb.id, name: "The Mandala", slug: "the-mandala" },
      null,
    ]);
  });

  it("refuses someone else's pending climb, a region, and a crag on an indoor session", async () => {
    const area = await createArea("user_a", buttermilks);
    const climb = await createClimb("user_a", mandala(area.id));
    const other = await createArea("user_b", { ...buttermilks, name: "Happy Boulders" });

    expect(
      (await call("user_b", "/v1/sessions", { body: session(area.id, climb.id) })).status
    ).toBe(400);
    expect(
      (await call("user_b", "/v1/sessions", { body: session(other.id, climb.id) })).status
    ).toBe(400);
    expect(
      (await call("user_a", "/v1/sessions", { body: session("region-us-ca", climb.id) })).status
    ).toBe(400);
    const indoor = { ...session(area.id, climb.id), location: "indoor" };
    expect((await call("user_a", "/v1/sessions", { body: indoor })).status).toBe(400);
  });

  it("replaces links on edit and removes them on delete", async () => {
    const area = await createArea("user_a", buttermilks);
    const climb = await createClimb("user_a", mandala(area.id));
    const res = await call("user_a", "/v1/sessions", { body: session(area.id, climb.id) });
    const fingerprint = (res.body["session"] as { fingerprint: string }).fingerprint;

    const edited = await call("user_a", `/v1/sessions/${fingerprint}`, {
      method: "PUT",
      body: {
        date: "2026-09-12",
        location: "outdoor",
        climbs: [{ name: "Mandala", climbId: climb.id, grade: { scale: "v", value: 12 } }],
      },
    });
    expect(edited.status).toBe(200);
    const linked = await read("user_a", fingerprint);
    expect(linked.area).toBeNull();
    expect(linked.climbs.map((c) => c.link?.id)).toEqual([climb.id]);
    expect(await linkCount(fingerprint)).toBe(1);

    await call("user_a", `/v1/sessions/${fingerprint}`, { method: "DELETE" });
    expect(await linkCount(fingerprint)).toBe(0);
  });

  it("lists only the reader's own sessions on a climb, newest first", async () => {
    const area = await createArea("user_a", buttermilks);
    const climb = await createClimb("user_a", mandala(area.id));
    await env.DB.prepare("UPDATE area_climbs SET status = 'active' WHERE id = ?")
      .bind(climb.id)
      .run();
    const attempt = session(area.id, climb.id);
    (attempt["climbs"] as Array<Record<string, unknown>>)[0]!["kind"] = "attempt";
    await call("user_a", "/v1/sessions", { body: attempt });
    await call("user_a", "/v1/sessions", {
      body: { ...session(area.id, climb.id), date: "2026-09-14" },
    });

    const own = await call("user_a", "/v1/area-climbs/the-mandala");
    expect(
      (own.body["sessions"] as Array<{ start_at: string; sent: boolean }>).map((s) => [
        s.start_at.slice(0, 10),
        s.sent,
      ])
    ).toEqual([
      ["2026-09-14", true],
      ["2026-09-12", false],
    ]);
    expect((await call("user_b", "/v1/area-climbs/the-mandala")).body["sessions"]).toEqual([]);
  });

  it("rejects one climb name pointing at two climbs", async () => {
    const area = await createArea("user_a", buttermilks);
    const a = await createClimb("user_a", mandala(area.id));
    const b = await createClimb("user_a", { ...mandala(area.id), name: "Stained Glass" });
    const body = session(area.id, a.id);
    const climbs = body["climbs"] as Array<Record<string, unknown>>;
    climbs[1] = { ...climbs[0], climbId: b.id };
    expect((await call("user_a", "/v1/sessions", { body })).status).toBe(400);
  });
});

describe("suggested edits", () => {
  const activate = async (table: "areas" | "area_climbs", id: string): Promise<void> => {
    await env.DB.prepare(`UPDATE ${table} SET status = 'active' WHERE id = ?`).bind(id).run();
  };

  const draftCount = async (entityId: string): Promise<number> =>
    (
      await env.DB.prepare("SELECT count(*) AS n FROM content_revisions WHERE entity_id = ?")
        .bind(entityId)
        .first<{ n: number }>()
    )?.n ?? 0;

  type Draft = { proposed: Record<string, unknown>; base: Record<string, unknown> };

  const put = (user: string, path: string, body: Record<string, unknown>) =>
    call(user, `${path}/draft`, { method: "PUT", body });

  const liveClimb = async (): Promise<{ area: Row; climb: Row }> => {
    const area = await createArea("user_a", buttermilks);
    const climb = await createClimb("user_a", mandala(area.id));
    await activate("areas", area.id);
    await activate("area_climbs", climb.id);
    return { area, climb };
  };

  it("keeps one draft per user per entity, holding only what changed", async () => {
    const { climb } = await liveClimb();
    const path = `/v1/area-climbs/${climb.id}`;
    const first = await put("user_b", path, { grade: "V11", name: "The Mandala" });
    expect(first.status).toBe(200);
    expect((first.body["draft"] as Draft).proposed).toEqual({ grade_value: "V11" });

    const second = await put("user_b", path, { grade: "V13", changeSummary: "guidebook" });
    expect((second.body["draft"] as Draft).proposed).toEqual({ grade_value: "V13" });
    expect(await draftCount(climb.id)).toBe(1);

    await put("user_c", path, { firstAscent: "Chris Sharma, 2000" });
    expect(await draftCount(climb.id)).toBe(2);

    const read = await call("user_b", `${path}/draft`);
    expect((read.body["draft"] as Draft).proposed).toEqual({ grade_value: "V13" });
    expect((await call("user_a", `${path}/draft`)).body["draft"]).toBeNull();
    const entity = await call("user_a", "/v1/area-climbs/the-mandala");
    expect(entity.body["climb"]).toMatchObject({ grade_value: "V12", first_ascent: null });

    expect((await call("user_b", `${path}/draft`, { method: "DELETE" })).status).toBe(200);
    expect((await call("user_b", `${path}/draft`)).body["draft"]).toBeNull();
    expect((await call("user_b", `${path}/draft`, { method: "DELETE" })).status).toBe(404);
    expect(await draftCount(climb.id)).toBe(1);
  });

  it("answers 400 for a draft that changes nothing or breaks the creation rules", async () => {
    const { area, climb } = await liveClimb();
    const same = await put("user_b", `/v1/areas/${area.id}`, { name: "Buttermilks" });
    expect(same).toEqual({ status: 400, body: { error: "no changes" } });
    const path = `/v1/area-climbs/${climb.id}`;
    expect((await put("user_b", path, { type: "sport" })).status).toBe(400);
    expect((await put("user_b", path, { areaId: "region-us-ca" })).status).toBe(400);
    expect(await draftCount(climb.id)).toBe(0);
  });

  it("refuses drafts on pending entities, 404 for anyone but the creator", async () => {
    const area = await createArea("user_a", buttermilks);
    expect((await put("user_b", `/v1/areas/${area.id}`, { name: "Milks" })).status).toBe(404);
    expect((await call("user_b", `/v1/areas/${area.id}/draft`)).status).toBe(404);
    expect((await put("user_a", `/v1/areas/${area.id}`, { name: "Milks" })).status).toBe(409);
  });

  it("proposes a new parent, but never one inside the area itself", async () => {
    const { area } = await liveClimb();
    const sector = await createArea("user_a", { parentId: area.id, name: "Get Carter Boulders" });
    await activate("areas", sector.id);
    const bishop = await createArea("user_a", { ...buttermilks, name: "Bishop", lat: 37.5 });
    await activate("areas", bishop.id);

    const into = (id: string) => put("user_b", `/v1/areas/${area.id}`, { parentId: id });
    expect((await into(sector.id)).status).toBe(400);
    expect((await into(area.id)).status).toBe(400);
    const moved = await into(bishop.id);
    expect(moved.status).toBe(200);
    expect((moved.body["draft"] as Draft).proposed).toEqual({ parent_id: bishop.id });
  });

  it("refreshes the base to the entity as it is now on every save", async () => {
    const { area } = await liveClimb();
    const path = `/v1/areas/${area.id}`;
    const first = await put("user_b", path, { description: "Granite boulders" });
    expect((first.body["draft"] as Draft).base).toMatchObject({ name: "Buttermilks", version: 1 });

    await env.DB.prepare("UPDATE areas SET name = 'The Milks', version = 2 WHERE id = ?")
      .bind(area.id)
      .run();
    const second = await put("user_b", path, { description: "Granite boulders" });
    expect((second.body["draft"] as Draft).base).toMatchObject({ name: "The Milks", version: 2 });
    expect(await draftCount(area.id)).toBe(1);
  });
});
