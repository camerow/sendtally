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
