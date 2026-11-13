import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { likelyDuplicates, planImport } from "@sendtally/core/import";
import { sha256Hex } from "../src/lib/import";
import { testApp } from "./harness";

const headers = { "x-test-user": "user_import", "Content-Type": "application/json" };

const v = (value: number) => ({ scale: "v", value });

const sessions = [
  {
    date: "2022-11-22",
    name: "Moe's Valley",
    location: "outdoor",
    rpe: 8,
    tags: ["trip"],
    notes: "Last day of the trip",
    climbs: [
      {
        name: "Lindners Roof",
        grade: v(9),
        kind: "send",
        style: "redpoint",
        tries: 30,
        note: "Foot swap",
      },
      { name: "Indolence", grade: v(7), kind: "send", tries: 7 },
    ],
  },
  {
    date: "2022-11-20",
    name: "Moe's Valley",
    location: "outdoor",
    climbs: [{ name: "Linders Roof", grade: v(9), kind: "attempt", tries: 10 }],
  },
  {
    date: "2023-01-05",
    location: "indoor",
    gym: "boulder barn",
    climbs: [
      { name: "", grade: { scale: "font", value: "6A+" }, kind: "send", style: "flash", tries: 1 },
    ],
  },
];

const post = (path: string, body: unknown) =>
  testApp().request(path, { method: "POST", headers, body: JSON.stringify(body) }, env);

describe("import", () => {
  it("imports a batch once, matches gyms by name, and exports it back in the same shape", async () => {
    const gym = await post("/v1/gyms", { name: "Boulder Barn", circuits: [], walls: [] });
    const { gym: created } = (await gym.json()) as { gym: { id: string } };

    const first = await post("/v1/sessions/import", { sessions });
    expect(first.status).toBe(201);
    expect(await first.json()).toEqual({ imported: 3, skipped: 0 });

    const again = await post("/v1/sessions/import", { sessions });
    expect(await again.json()).toEqual({ imported: 0, skipped: 3 });

    const list = await testApp().request("/v1/sessions", { headers }, env);
    const { sessions: rows } = (await list.json()) as {
      sessions: Array<{
        fingerprint: string;
        start_at: string;
        name: string | null;
        gym_id: string | null;
        rpe: number;
        title: string;
        tags: Array<{ name: string }>;
      }>;
    };
    expect(rows.map((r) => r.start_at.slice(0, 10))).toEqual([
      "2023-01-05",
      "2022-11-22",
      "2022-11-20",
    ]);
    expect(rows.every((r) => r.fingerprint.startsWith("import-"))).toBe(true);
    expect(rows[0]).toMatchObject({ gym_id: created.id, name: null });
    expect(rows[1]).toMatchObject({ name: "Moe's Valley", rpe: 8, title: "Moe's Valley" });
    expect(rows[1]?.tags.map((t) => t.name)).toEqual(["trip"]);
    expect(rows[2]?.rpe).toBeGreaterThanOrEqual(1);

    const detail = await testApp().request(
      `/v1/sessions/${rows[1]!.fingerprint}`,
      { headers },
      env
    );
    const { session } = (await detail.json()) as {
      session: { notes: string | null; climbs: Array<{ name: string; note: string | null }> };
    };
    expect(session.notes).toBe("Last day of the trip");
    expect(session.climbs[0]).toMatchObject({ name: "Lindners Roof", note: "Foot swap" });

    const exported = await testApp().request("/v1/export.csv", { headers }, env);
    expect(exported.status).toBe(200);
    expect(exported.headers.get("content-type")).toContain("text/csv");
    const lines = (await exported.text()).trimEnd().split("\r\n");
    expect(lines[0]).toBe(
      "date,session,location,gym,start_time,end_time,rpe,tags,session_notes,climb,grade,kind,style,tries,wall,climb_notes,circuit,title,source,session_id"
    );
    expect(lines).toHaveLength(5);
    expect(lines[1]).toMatch(
      /^2022-11-20,Moe's Valley,outdoor,,,,\d+,,,Linders Roof,V9,attempt,,10,,,,/
    );
    expect(lines[2]).toBe(
      `2022-11-22,Moe's Valley,outdoor,,,,8,trip,Last day of the trip,Lindners Roof,V9,send,redpoint,30,,Foot swap,,Moe's Valley,manual,${rows[1]!.fingerprint}`
    );
    expect(lines[4]).toMatch(/^2023-01-05,,indoor,Boulder Barn,,,\d+,,,,6A\+,send,flash,1,,,,/);
  });

  it("fingerprints a planned session as the Worker does, so an imported one is not a likely duplicate", async () => {
    const user = { ...headers, "x-test-user": "user_import_fingerprint" };
    const csv = [
      "date,session,climb,grade",
      "2026-11-10,Gym night,Blue crimps,V4",
      "2026-11-10,Gym night,,V5",
    ].join("\n");
    const { sessions: planned } = planImport(csv, "UTC");
    const [session] = planned;
    expect(session?.climbs.map((c) => c.tries)).toEqual([1, 1]);
    session!.climbs[0]!.name = "  Blue crimps  ";
    const body = { sessions: planned.map(({ rows: _rows, ...s }) => s) };
    const res = await testApp().request(
      "/v1/sessions/import",
      { method: "POST", headers: user, body: JSON.stringify(body) },
      env
    );
    expect(await res.json()).toEqual({ imported: 1, skipped: 0 });
    const log = await testApp().request("/v1/sessions?include=climbs", { headers: user }, env);
    const { sessions } = (await log.json()) as { sessions: Parameters<typeof likelyDuplicates>[1] };
    expect(await likelyDuplicates(planned, sessions, sha256Hex)).toEqual([]);
  });

  it("rejects a session the log form would reject", async () => {
    const res = await post("/v1/sessions/import", {
      sessions: [{ date: "2022-13-01", location: "outdoor", climbs: [{ grade: v(1) }] }],
    });
    expect(res.status).toBe(400);
  });

  it("lists the whole log, however long", async () => {
    const day = (i: number) =>
      new Date(Date.UTC(2015, 0, 1) + i * 86_400_000).toISOString().slice(0, 10);
    const many = Array.from({ length: 250 }, (_, i) => ({
      date: day(i),
      location: "indoor",
      climbs: [{ grade: v(3), kind: "send", tries: 1 }],
    }));
    const longLog = { ...headers, "x-test-user": "user_long_log" };
    for (const batch of [many.slice(0, 125), many.slice(125)]) {
      const res = await testApp().request(
        "/v1/sessions/import",
        { method: "POST", headers: longLog, body: JSON.stringify({ sessions: batch }) },
        env
      );
      expect(res.status).toBe(201);
    }
    const list = await testApp().request("/v1/sessions", { headers: longLog }, env);
    expect(((await list.json()) as { sessions: unknown[] }).sessions).toHaveLength(250);
  });
});
