import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";

type Region = { id: string; parent_id: string | null; path: string; depth: number; slug: string };

const region = (code: string): Promise<Region | null> =>
  env.DB.prepare("SELECT id, parent_id, path, depth, slug FROM areas WHERE region_code = ?")
    .bind(code)
    .first<Region>();

const regionCount = async (): Promise<number> =>
  (await env.DB.prepare("SELECT count(*) AS n FROM areas").first<{ n: number }>())?.n ?? 0;

describe("region seed", () => {
  it("seeds every country with US states and Canadian provinces beneath", async () => {
    expect(await region("US")).toEqual({
      id: "region-us",
      parent_id: null,
      path: "/region-us/",
      depth: 0,
      slug: "united-states",
    });
    expect(await region("US-CA")).toEqual({
      id: "region-us-ca",
      parent_id: "region-us",
      path: "/region-us/region-us-ca/",
      depth: 1,
      slug: "california",
    });
    expect((await region("US-GA"))?.slug).toBe("georgia-united-states");
    expect((await region("GE"))?.slug).toBe("georgia");
    expect((await region("CA-BC"))?.parent_id).toBe("region-ca");

    const depths = await env.DB.prepare(
      "SELECT depth, count(*) AS n FROM areas WHERE status = 'active' GROUP BY depth ORDER BY depth"
    ).all<{ depth: number; n: number }>();
    expect(depths.results).toEqual([
      { depth: 0, n: 249 },
      { depth: 1, n: 64 },
    ]);
  });

  it("inserts nothing when applied again", async () => {
    const seed = env.TEST_MIGRATIONS.find((m) => m.name.includes("seed_regions"));
    expect(seed).toBeDefined();
    const before = await regionCount();
    for (const query of seed?.queries ?? []) await env.DB.prepare(query).run();
    expect(await regionCount()).toBe(before);
  });
});

describe("content revisions", () => {
  const draft = (id: string, status: string): D1PreparedStatement =>
    env.DB.prepare(
      `INSERT INTO content_revisions
        (id, entity_type, entity_id, proposed_json, base_json, status, submitted_by, created_at, updated_at)
        VALUES (?, 'area', 'region-fr', '{}', '{}', ?, 'user_drafts', '2026-09-18', '2026-09-18')`
    ).bind(id, status);

  it("allows one pending draft per user per entity", async () => {
    await draft("r1", "approved").run();
    await draft("r2", "approved").run();
    await draft("r3", "pending").run();
    await expect(draft("r4", "pending").run()).rejects.toThrow(/UNIQUE/);
  });
});
