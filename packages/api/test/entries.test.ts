import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { testApp } from "./harness";

type Entry = {
  id: string;
  kind: string;
  occurred_at: string;
  ends_at: string | null;
  title: string | null;
  body: string;
  fingerprint: string | null;
  parent_id: string | null;
  severity: number | null;
  status: string | null;
  tags: Array<{ slug: string; name: string }>;
};

const call = (userId: string, path: string, init: RequestInit = {}) =>
  testApp().request(
    path,
    {
      ...init,
      headers: { "x-test-user": userId, "Content-Type": "application/json", ...init.headers },
    },
    env
  );

const post = (userId: string, body: unknown) =>
  call(userId, "/v1/entries", { method: "POST", body: JSON.stringify(body) });

const created = async (userId: string, body: unknown): Promise<Entry> => {
  const res = await post(userId, body);
  expect(res.status).toBe(201);
  return ((await res.json()) as { entry: Entry }).entry;
};

const list = async (userId: string): Promise<Entry[]> => {
  const res = await call(userId, "/v1/entries");
  return ((await res.json()) as { entries: Entry[] }).entries;
};

const note = { kind: "journal", occurred_at: "2026-05-30", body: "Good hour at the end." };

describe("journal entries", () => {
  it("creates, reads back and lists newest first", async () => {
    const older = await created("u_entries", { ...note, occurred_at: "2026-05-20" });
    const newer = await created("u_entries", {
      kind: "journal",
      occurred_at: "2026-05-28",
      title: "Steep ground feels easy now",
      body: "Keep the volume where it is.",
      tags: ["body", "Indoor"],
    });

    expect((await list("u_entries")).map((e) => e.id)).toEqual([newer.id, older.id]);
    expect(newer.tags.map((t) => t.slug).sort()).toEqual(["body", "indoor"]);
    expect(newer.title).toBe("Steep ground feels easy now");

    const res = await call("u_entries", `/v1/entries/${newer.id}`);
    expect(res.status).toBe(200);
  });

  it("keeps one user's entries out of another's", async () => {
    await created("u_entries_mine", note);
    expect(await list("u_entries_theirs")).toEqual([]);
    const res = await call(
      "u_entries_theirs",
      `/v1/entries/${(await list("u_entries_mine"))[0]!.id}`
    );
    expect(res.status).toBe(404);
  });

  it("edits an entry and replaces its tags", async () => {
    const entry = await created("u_entries_edit", { ...note, tags: ["indoor"] });
    const res = await call("u_entries_edit", `/v1/entries/${entry.id}`, {
      method: "PUT",
      body: JSON.stringify({ ...note, body: "Second thoughts.", tags: ["outdoor"] }),
    });
    expect(res.status).toBe(200);
    const updated = ((await res.json()) as { entry: Entry }).entry;
    expect(updated.body).toBe("Second thoughts.");
    expect(updated.tags.map((t) => t.slug)).toEqual(["outdoor"]);
  });

  it("rejects a span that ends before it starts, and one on a kind that has no span", async () => {
    const backwards = await post("u_entries_bad", {
      kind: "trip",
      occurred_at: "2026-05-26",
      ends_at: "2026-05-22",
      body: "",
    });
    expect(backwards.status).toBe(400);

    const noSpan = await post("u_entries_bad", { ...note, ends_at: "2026-06-01" });
    expect(noSpan.status).toBe(400);
  });

  it("opens an injury as ongoing without being told to", async () => {
    const injury = await created("u_entries_injury", {
      kind: "injury",
      occurred_at: "2026-05-18",
      body: "Felt it on a two-finger pocket.",
    });
    expect(injury.status).toBe("ongoing");
  });

  it("threads updates under an injury, oldest first, and keeps them out of the log", async () => {
    const injury = await created("u_thread", {
      kind: "injury",
      occurred_at: "2026-05-18",
      body: "Onset.",
    });
    await created("u_thread", {
      kind: "journal",
      occurred_at: "2026-06-08",
      body: "Full session open handed.",
      parent_id: injury.id,
      severity: 4,
    });
    await created("u_thread", {
      kind: "journal",
      occurred_at: "2026-05-22",
      body: "Still sore.",
      parent_id: injury.id,
      severity: 7,
    });

    const res = await call("u_thread", `/v1/entries/${injury.id}`);
    const { entry } = (await res.json()) as { entry: Entry & { updates: Entry[] } };
    expect(entry.updates.map((u) => u.severity)).toEqual([7, 4]);
  });

  it("refuses severity on an entry that belongs to no thread", async () => {
    const res = await post("u_thread_bad", { ...note, severity: 5 });
    expect(res.status).toBe(400);
  });

  it("deleting an injury takes its updates with it", async () => {
    const injury = await created("u_thread_del", {
      kind: "injury",
      occurred_at: "2026-05-18",
      body: "Onset.",
    });
    await created("u_thread_del", {
      kind: "journal",
      occurred_at: "2026-05-22",
      body: "Sore.",
      parent_id: injury.id,
      severity: 7,
    });
    expect((await list("u_thread_del")).length).toBe(2);

    const res = await call("u_thread_del", `/v1/entries/${injury.id}`, { method: "DELETE" });
    expect(res.status).toBe(200);
    expect(await list("u_thread_del")).toEqual([]);
  });

  it("keeps a tag alive while only an entry wears it", async () => {
    await created("u_entries_tag", { ...note, tags: ["psyched"] });
    const res = await call("u_entries_tag", "/v1/tags");
    const { tags } = (await res.json()) as { tags: Array<{ slug: string }> };
    expect(tags.map((t) => t.slug)).toEqual(["psyched"]);
  });

  it("answers 404 for an edit or delete of something that is not there", async () => {
    expect(
      (
        await call("u_entries_missing", "/v1/entries/nope", {
          method: "PUT",
          body: JSON.stringify(note),
        })
      ).status
    ).toBe(404);
    expect((await call("u_entries_missing", "/v1/entries/nope", { method: "DELETE" })).status).toBe(
      404
    );
  });

  it("requires a signed-in user", async () => {
    const res = await testApp().request("/v1/entries", {}, env);
    expect(res.status).toBe(401);
  });
});

// The backfill is a one-shot production data move that cannot be re-run, so it
// is exercised here against the same SQL the migration applies.
describe("session notes backfill", () => {
  const backfill = async (): Promise<void> => {
    const sql = await import("../migrations/0018_backfill_session_notes.sql?raw");
    await env.DB.prepare(sql.default).run();
  };

  const seedSession = (userId: string, fingerprint: string, notes: string | null) =>
    env.DB.batch([
      env.DB.prepare(
        `INSERT OR IGNORE INTO users (id, timezone, created_at) VALUES (?, 'UTC', '')`
      ).bind(userId),
      env.DB.prepare(
        `INSERT INTO sessions (user_id, fingerprint, source, start_at, end_at, climb_count, top_grade, top_send_grade, rpe, title, summary, notes)
         VALUES (?, ?, 'manual', '2026-02-14T18:00:00.000Z', '2026-02-14T19:30:00.000Z', 6, 5, 5, 6, 'Session', 's', ?)`
      ).bind(userId, fingerprint, notes),
    ]);

  it("moves a written note onto an entry dated to its session, and skips the rest", async () => {
    await seedSession("u_backfill", "fp_written", "Shoulder held up.");
    await seedSession("u_backfill", "fp_empty", "   ");
    await seedSession("u_backfill", "fp_none", null);

    await backfill();

    const rows = await env.DB.prepare(
      `SELECT kind, occurred_at, body, fingerprint FROM journal_entries WHERE user_id = 'u_backfill'`
    ).all<{ kind: string; occurred_at: string; body: string; fingerprint: string }>();
    expect(rows.results).toEqual([
      {
        kind: "journal",
        occurred_at: "2026-02-14",
        body: "Shoulder held up.",
        fingerprint: "fp_written",
      },
    ]);
  });

  it("is safe to apply twice", async () => {
    await seedSession("u_backfill_twice", "fp_twice", "Once only.");
    await backfill();
    await backfill();

    const { count } = (await env.DB.prepare(
      `SELECT COUNT(*) AS count FROM journal_entries WHERE user_id = 'u_backfill_twice'`
    ).first<{ count: number }>())!;
    expect(count).toBe(1);
  });
});
