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

  it("adds a typed area at the top level, pending and without coordinates", async () => {
    const area = await createArea("user_a", { name: "Burbage Valley North" });
    expect(area).toMatchObject({ slug: "burbage-valley-north", status: "pending", mine: true });
    const row = await env.DB.prepare(
      "SELECT parent_id, path, depth, region_code FROM areas WHERE id = ?"
    )
      .bind(area.id)
      .first();
    expect(row).toEqual({ parent_id: null, path: `/${area.id}/`, depth: 0, region_code: null });
    expect((await call("user_b", "/v1/areas/burbage-valley-north")).status).toBe(404);

    const again = await call("user_a", "/v1/areas", { body: { name: "burbage valley north" } });
    expect(again.status).toBe(409);
    const second = await createArea("user_a", { name: "Burbage Valley North", confirmedNew: true });
    expect(second.slug).toBe("burbage-valley-north-2");

    const climb = await createClimb("user_a", mandala(area.id));
    expect(climb).toMatchObject({ status: "pending" });
  });

  it("never lets a user create a region or an uncoordinated area in one", async () => {
    const unknownParent = await call("user_a", "/v1/areas", {
      body: { parentId: "nowhere", name: "Atlantis", lat: 0, lon: 0 },
    });
    expect(unknownParent.status).toBe(400);
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
    climbs: [
      { name: "The Mandala", climbId, areaId, grade: { scale: "v", value: 12 } },
      { name: "Warm up", areaId, grade: { scale: "v", value: 3 } },
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
    expect(linked.area).toEqual({ id: area.id, name: "Buttermilks", slug: "buttermilks" });
    expect(linked.climbs.map((c) => c.link)).toEqual([
      { id: climb.id, name: "The Mandala", slug: "the-mandala" },
      null,
    ]);
  });

  it("refuses someone else's pending climb, a region, and an unnamed climb's crag indoors", async () => {
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
    const indoor = (name: string) => ({
      date: "2026-09-12",
      location: "indoor",
      climbs: [{ name, areaId: area.id, grade: { scale: "v", value: 3 } }],
    });
    expect((await call("user_a", "/v1/sessions", { body: indoor("") })).status).toBe(400);
    expect((await call("user_a", "/v1/sessions", { body: indoor("Arete") })).status).toBe(201);
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
    expect(linked.area).toEqual({ id: area.id, name: "Buttermilks", slug: "buttermilks" });
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

describe("editing a climb", () => {
  it("moves a climb to a crag, links it to a climb there, and regrades it", async () => {
    const user = "user_edit_climb";
    const area = await createArea(user, { ...buttermilks, name: "Edit Crag" });
    const linked = await createClimb(user, mandala(area.id));
    expect((await call(user, "/v1/projects", { body: { name: "Mandala" } })).status).toBe(200);
    const climbs = async () =>
      (await call(user, "/v1/climbs")).body["climbs"] as Array<Record<string, unknown>>;
    const [climb] = await climbs();

    const edit = (body: unknown) =>
      call(user, `/v1/climbs/${String(climb?.["id"])}`, { method: "PATCH", body });
    expect(
      (await edit({ areaId: area.id, areaClimbId: linked.id, grade: { scale: "v", value: 12 } }))
        .status
    ).toBe(200);
    expect((await climbs())[0]).toMatchObject({
      area: { id: area.id, name: "Edit Crag" },
      area_climb_id: linked.id,
      grade: { scale: "v", value: 12 },
    });

    expect((await edit({ areaId: "nowhere" })).status).toBe(400);
    expect((await edit({ areaClimbId: "no-such-climb" })).status).toBe(400);
    expect((await edit({ areaId: null, areaClimbId: null })).status).toBe(200);
    expect((await climbs())[0]).toMatchObject({ area: null, area_climb_id: null });
  });
});

describe("a climb's crag", () => {
  const logAt = (user: string, areaId: string, date: string, project?: boolean) =>
    call(user, "/v1/sessions", {
      body: {
        date,
        location: "outdoor",
        climbs: [{ name: "Arete", areaId, grade: { scale: "v", value: 4 }, project }],
      },
    });
  const arete = async (user: string): Promise<Record<string, unknown> | undefined> =>
    ((await call(user, "/v1/climbs")).body["climbs"] as Array<Record<string, unknown>>).find(
      (c) => c["name"] === "Arete"
    );

  it("is the crag it was first logged at, and stays there", async () => {
    const user = "user_crag_first";
    const first = await createArea(user, { ...buttermilks, name: "First Crag" });
    const second = await createArea(user, { ...buttermilks, name: "Second Crag" });
    expect((await logAt(user, first.id, "2026-09-01", true)).status).toBe(201);
    const stored = await env.DB.prepare("SELECT area_id FROM user_climbs WHERE user_id = ?")
      .bind(user)
      .first<{ area_id: string | null }>();
    expect(stored?.area_id).toBe(first.id);

    expect((await logAt(user, second.id, "2026-09-02")).status).toBe(201);
    expect((await arete(user))?.["area"]).toEqual({ id: first.id, name: "First Crag" });
  });

  it("stays cleared once its crag is emptied", async () => {
    const user = "user_crag_cleared";
    const crag = await createArea(user, { ...buttermilks, name: "Cleared Crag" });
    expect((await logAt(user, crag.id, "2026-09-01", true)).status).toBe(201);
    const id = String((await arete(user))?.["id"]);
    const cleared = await call(user, `/v1/climbs/${id}`, {
      method: "PATCH",
      body: { areaId: null, areaClimbId: null },
    });
    expect(cleared.status).toBe(200);
    expect((await arete(user))?.["area"]).toBeNull();
    expect((await arete(user))?.["area"]).toBeNull();
  });
});

describe("each climb's area", () => {
  type Place = { id: string; name: string; slug: string };
  type Saved = {
    fingerprint: string;
    area: Place | null;
    areas: Place[];
    climbs: Array<{ name: string; area: Place | null }>;
  };
  const v = (value: number) => ({ scale: "v", value });
  const log = async (user: string, body: Record<string, unknown>): Promise<Saved> => {
    const res = await call(user, "/v1/sessions", { body: { date: "2026-09-12", ...body } });
    expect(res.status).toBe(201);
    return res.body["session"] as Saved;
  };
  const read = async (user: string, fingerprint: string): Promise<Saved> =>
    (await call(user, `/v1/sessions/${fingerprint}`)).body["session"] as Saved;
  const place = (row: Row) => ({ id: row.id, name: row.name, slug: row.slug });
  const crags = async (user: string): Promise<[Row, Row]> => [
    await createArea(user, { ...buttermilks, name: "Stanage Popular" }),
    await createArea(user, { ...buttermilks, name: "Stanage Plantation" }),
  ];

  it("saves a two-area day with each climb at its own area", async () => {
    const user = "user_two_areas";
    const [popular, plantation] = await crags(user);
    const saved = await log(user, {
      location: "outdoor",
      climbs: [
        { name: "Flying Buttress", areaId: popular.id, grade: v(1) },
        { name: "Crack and Slab", areaId: plantation.id, grade: v(2) },
        { name: "Flying Buttress", areaId: popular.id, grade: v(1), kind: "attempt" },
      ],
    });
    expect(saved.areas).toEqual([place(popular), place(plantation)]);
    expect(saved.area).toEqual(place(popular));
    expect(saved.climbs.map((c) => c.area?.id)).toEqual([popular.id, plantation.id, popular.id]);
  });

  it("fills a climb's empty area and never moves one that has an area", async () => {
    const user = "user_fill_area";
    const [popular, plantation] = await crags(user);
    await log(user, { location: "outdoor", climbs: [{ name: "Arete", grade: v(4) }] });
    const first = await log(user, {
      location: "outdoor",
      climbs: [{ name: "Arete", areaId: popular.id, grade: v(4) }],
    });
    const second = await log(user, {
      location: "outdoor",
      climbs: [{ name: "arete", areaId: plantation.id, grade: v(4) }],
    });
    expect(second.areas).toEqual([place(popular)]);
    expect((await read(user, first.fingerprint)).climbs[0]?.area?.id).toBe(popular.id);
  });

  it("refills a cleared climb when it is next logged at an area", async () => {
    const user = "user_refill_area";
    const [popular, plantation] = await crags(user);
    await log(user, {
      location: "outdoor",
      climbs: [{ name: "Arete", areaId: popular.id, grade: v(4) }],
    });
    const [record] = (await call(user, "/v1/climbs")).body["climbs"] as Row[];
    await call(user, `/v1/climbs/${String(record?.id)}`, {
      method: "PATCH",
      body: { areaId: null, areaClimbId: null },
    });
    await log(user, { location: "outdoor", climbs: [{ name: "Arete", grade: v(4) }] });
    expect((await call(user, "/v1/climbs")).body["climbs"]).toMatchObject([{ area: null }]);

    const again = await log(user, {
      location: "outdoor",
      climbs: [{ name: "Arete", areaId: plantation.id, grade: v(4) }],
    });
    expect(again.areas).toEqual([place(plantation)]);
  });

  it("gives a climb added from Projects its area the first time it is logged", async () => {
    const user = "user_project_area";
    const [popular] = await crags(user);
    expect((await call(user, "/v1/projects", { body: { name: "Arete" } })).status).toBe(200);
    await log(user, {
      location: "outdoor",
      climbs: [{ name: "Arete", areaId: popular.id, grade: v(4) }],
    });
    expect((await call(user, "/v1/climbs")).body["climbs"]).toMatchObject([
      { name: "Arete", area: { id: popular.id }, project: true },
    ]);
  });

  it("keeps a named climb's area in an Indoor session, the gym day and crag as one", async () => {
    const user = "user_indoor_area";
    const [popular] = await crags(user);
    const saved = await log(user, {
      location: "indoor",
      climbs: [
        { name: "", grade: v(3) },
        { name: "Arete", areaId: popular.id, grade: v(4) },
      ],
    });
    expect(saved.areas).toEqual([place(popular)]);
    expect(saved.climbs.map((c) => c.area?.id ?? null)).toEqual([null, popular.id]);
  });

  it("puts a linked climb at its Areas climb's area, and refuses one at another area", async () => {
    const user = "user_linked_area";
    const [popular, plantation] = await crags(user);
    const climb = await createClimb(user, mandala(popular.id));
    const linked = { name: "The Mandala", climbId: climb.id, grade: v(12) };
    const saved = await log(user, { location: "outdoor", climbs: [linked] });
    expect(saved.areas).toEqual([place(popular)]);
    const elsewhere = await call(user, "/v1/sessions", {
      body: {
        date: "2026-09-13",
        location: "outdoor",
        climbs: [{ ...linked, areaId: plantation.id }],
      },
    });
    expect(elsewhere.status).toBe(400);
  });

  it("places a climb linked in a sector under the picked area at that sector", async () => {
    const user = "user_sector_area";
    const [popular] = await crags(user);
    const sector = await createArea(user, { parentId: popular.id, name: "Flying Buttress Area" });
    const climb = await createClimb(user, mandala(sector.id));
    const saved = await log(user, {
      location: "outdoor",
      climbs: [{ name: "The Mandala", climbId: climb.id, areaId: popular.id, grade: v(12) }],
    });
    expect(saved.areas).toEqual([place(sector)]);
  });

  it("keeps a grade-only day's area on the session, and only on such a day", async () => {
    const user = "user_grade_only_area";
    const [popular, plantation] = await crags(user);
    const gradeOnly = await log(user, {
      location: "outdoor",
      climbs: [{ areaId: popular.id, grade: v(3) }],
    });
    expect(gradeOnly.areas).toEqual([place(popular)]);
    expect(gradeOnly.climbs[0]?.area).toBeNull();

    const mixed = await log(user, {
      location: "outdoor",
      climbs: [
        { areaId: popular.id, grade: v(3) },
        { name: "Arete", areaId: plantation.id, grade: v(4) },
      ],
    });
    expect(mixed.areas).toEqual([place(plantation)]);
    const stored = await env.DB.prepare("SELECT area_id FROM sessions WHERE fingerprint = ?")
      .bind(mixed.fingerprint)
      .first<{ area_id: string | null }>();
    expect(stored?.area_id).toBeNull();
  });

  it("ignores a session-level area from an older app", async () => {
    const user = "user_session_area";
    const [popular] = await crags(user);
    const saved = await log(user, {
      location: "outdoor",
      areaId: popular.id,
      climbs: [{ name: "Arete", grade: v(4) }],
    });
    expect(saved.areas).toEqual([]);
    expect(saved.area).toBeNull();
  });
});

// The backfill is a one-shot production data move, so it is exercised here
// against the same SQL the migration applies.
describe("climb crag backfill", () => {
  const backfill = async (): Promise<void> => {
    const sql = await import("../migrations/0036_backfill_climb_crags.sql?raw");
    for (const statement of sql.default.split("--> statement-breakpoint")) {
      await env.DB.prepare(statement).run();
    }
  };
  const seedSession = (
    user: string,
    fingerprint: string,
    startAt: string,
    areaId: string | null,
    climbs: unknown[]
  ) =>
    env.DB.batch([
      env.DB.prepare(
        `INSERT OR IGNORE INTO users (id, timezone, created_at) VALUES (?, 'UTC', '')`
      ).bind(user),
      env.DB.prepare(
        `INSERT INTO sessions (user_id, fingerprint, source, start_at, end_at, climb_count, top_grade, top_send_grade, rpe, title, summary, area_id, climbs_json)
         VALUES (?, ?, 'manual', ?, ?, 1, 3, 3, 5, 'Session', 's', ?, ?)`
      ).bind(user, fingerprint, startAt, startAt, areaId, JSON.stringify(climbs)),
    ]);
  const seedClimb = (
    user: string,
    id: string,
    name: string,
    place: { area_id?: string; area_climb_id?: string } = {}
  ) =>
    env.DB.prepare(
      `INSERT INTO user_climbs (user_id, id, name, name_key, discipline, area_id, area_climb_id, working, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'boulder', ?, ?, 0, '', '')`
    )
      .bind(
        user,
        id,
        name,
        name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        place.area_id ?? null,
        place.area_climb_id ?? null
      )
      .run();
  const cragOf = async (id: string): Promise<string | null | undefined> =>
    (
      await env.DB.prepare("SELECT area_id FROM user_climbs WHERE id = ?")
        .bind(id)
        .first<{ area_id: string | null }>()
    )?.area_id;

  it("gives a climb the crag of the newest session it was logged at one in", async () => {
    const user = "u_crag_backfill";
    await seedSession(user, "fp_gym", "2026-09-03T18:00:00Z", null, [{ name: "ARETE" }]);
    await seedSession(user, "fp_new", "2026-09-02T18:00:00Z", "crag-new", [{ name: "arete " }]);
    await seedSession(user, "fp_old", "2026-09-01T18:00:00Z", "crag-old", [{ name: "Arete" }]);
    await seedSession(user, "fp_stamped", "2026-09-04T18:00:00Z", "crag-other", [
      { name: "Arete", userClimbId: "uc-other" },
      { name: "Old name", userClimbId: "uc-renamed" },
    ]);
    await seedClimb(user, "uc-arete", "Arete");
    await seedClimb(user, "uc-renamed", "New name");
    await seedClimb(user, "uc-placed", "Placed", { area_id: "crag-kept" });
    await seedSession(user, "fp_placed", "2026-09-05T18:00:00Z", "crag-new", [{ name: "Placed" }]);

    await backfill();
    await backfill();

    expect(await cragOf("uc-arete")).toBe("crag-new");
    expect(await cragOf("uc-renamed")).toBe("crag-other");
    expect(await cragOf("uc-placed")).toBe("crag-kept");
  });

  it("falls back to the crag of the Areas climb it is linked to", async () => {
    const user = "u_crag_backfill_link";
    const area = await createArea(user, { ...buttermilks, name: "Linked Crag" });
    const linked = await createClimb(user, mandala(area.id));
    await seedSession(user, "fp_gym_link", "2026-09-01T18:00:00Z", null, [{ name: "The Mandala" }]);
    await seedClimb(user, "uc-linked", "The Mandala", { area_climb_id: linked.id });
    await seedClimb(user, "uc-nowhere", "Nowhere");

    await backfill();

    expect(await cragOf("uc-linked")).toBe(area.id);
    expect(await cragOf("uc-nowhere")).toBeNull();
  });
});
