import { env } from "cloudflare:test";
import { describe, expect, it, vi } from "vitest";
import type { BuiltInLibrary, LibraryEntry } from "@sendtally/core/hang";
import { createdSpec } from "../src/lib/library";
import * as repo from "../src/lib/repo";
import { testApp } from "./harness";

const call = async (
  user: string | null,
  path: string,
  init: { method?: string; body?: unknown; headers?: Record<string, string> } = {}
): Promise<{ status: number; body: Record<string, unknown>; headers: Headers }> => {
  const res = await testApp().request(
    path,
    {
      method: init.method ?? (init.body === undefined ? "GET" : "POST"),
      headers: {
        ...(user === null ? {} : { "x-test-user": user }),
        "Content-Type": "application/json",
        ...init.headers,
      },
      ...(init.body === undefined ? {} : { body: JSON.stringify(init.body) }),
    },
    env
  );
  const text = await res.text();
  return {
    status: res.status,
    body: text === "" ? {} : (JSON.parse(text) as Record<string, unknown>),
    headers: res.headers,
  };
};

const moderator = async (user: string): Promise<string> => {
  await env.DB.prepare(
    "INSERT OR IGNORE INTO users (id, created_at, role) VALUES (?, 'x', 'moderator')"
  )
    .bind(user)
    .run();
  return user;
};

const library = async (): Promise<BuiltInLibrary> =>
  (await call(null, "/v1/library")).body["library"] as BuiltInLibrary;

const halfCrimp = async (): Promise<LibraryEntry> =>
  (await library()).grips.find((g) => g.id === "half")!;

describe("built-in library", () => {
  it("serves every seeded built-in with its translations to anyone, cacheably", async () => {
    const res = await call(null, "/v1/library");
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("public, no-cache");
    const { exercises, grips, workouts } = res.body["library"] as BuiltInLibrary;
    expect(exercises.length).toBeGreaterThan(100);
    expect(grips.map((g) => g.id)).toContain("mono");
    const repeaters = workouts.find((w) => w.id === "rep73")!;
    expect(repeaters.name).toBe("Repeaters 7:3");
    expect(repeaters.description).not.toBe("");
    expect(repeaters.translations.de?.name).toBeTruthy();
    expect(repeaters.spec.items[0]).toHaveProperty("grip");
    const again = await call(null, "/v1/library", {
      headers: { "If-None-Match": res.headers.get("ETag")! },
    });
    expect(again.status).toBe(304);
  });

  it("lets only moderators edit a built-in", async () => {
    const res = await call("climber", "/v1/moderation/library/grip/half", {
      method: "PUT",
      body: { name: "Half crimp", description: "", names: {}, status: "active" },
    });
    expect(res.status).toBe(403);
  });

  it("clears a changed English description's translations, keeps names as sent, and restores", async () => {
    const mod = await moderator("mod-1");
    await env.DB.prepare(
      `UPDATE library_items SET description = 'Old', translations = '{"de":{"name":"Halbe Leiste","description":"Alt"}}' WHERE type = 'grip' AND id = 'half'`
    ).run();
    const edit = (body: Record<string, unknown>) =>
      call(mod, "/v1/moderation/library/grip/half", {
        method: "PUT",
        body: {
          name: "Half crimp",
          description: "Old",
          names: { de: "Halbe Leiste" },
          status: "active",
          ...body,
        },
      });

    expect((await edit({ names: { de: "Halbe Leiste", fr: "Demi-arquée" } })).status).toBe(200);
    expect((await halfCrimp()).translations).toEqual({
      de: { name: "Halbe Leiste", description: "Alt" },
      fr: { name: "Demi-arquée" },
    });

    await edit({ description: "- Index to ring\n- Thumb off", names: { de: "Halbe Leiste" } });
    const edited = await halfCrimp();
    expect(edited.description).toBe("- Index to ring\n- Thumb off");
    expect(edited.translations).toEqual({ de: { name: "Halbe Leiste" } });
    expect(edited.updatedAt).not.toBeNull();

    await edit({ description: "- Index to ring\n- Thumb off", status: "retired" });
    expect((await halfCrimp()).status).toBe("retired");

    const changes = (await call(mod, "/v1/moderation/library/grip/half")).body["changes"] as {
      id: string;
      changedBy: string;
      before: { status: string; description: string };
    }[];
    expect(changes).toHaveLength(3);
    expect(changes[0]!.before.status).toBe("active");
    expect(changes[1]!.before.description).toBe("Old");

    const restored = await call(mod, `/v1/moderation/library/changes/${changes[1]!.id}/restore`, {
      method: "POST",
    });
    expect(restored.status).toBe(200);
    const back = await halfCrimp();
    expect(back.description).toBe("Old");
    expect(back.status).toBe("active");
    expect(back.translations.de?.description).toBe("Alt");
    expect(
      ((await call(mod, "/v1/moderation/library/grip/half")).body["changes"] as unknown[]).length
    ).toBe(4);
  });

  it("answers 404 for an unknown built-in", async () => {
    const mod = await moderator("mod-2");
    const res = await call(mod, "/v1/moderation/library/exercise/nope", {
      method: "PUT",
      body: { name: "Nope", description: "", names: {}, status: "active" },
    });
    expect(res.status).toBe(404);
  });
});

describe("creating a built-in", () => {
  const exercise = {
    name: "Pull-up negatives",
    description: "Slow lowers.",
    names: { de: "Negative Klimmzüge" },
    spec: { kind: "strength", measure: "reps" },
  };
  const create = (user: string, type: string, body: unknown) =>
    call(user, `/v1/moderation/library/${type}`, { method: "POST", body });

  it("is for moderators only", async () => {
    expect((await create("climber", "exercise", exercise)).status).toBe(403);
  });

  it("adds an exercise last, named from its id, logs it, and refuses the id again", async () => {
    const mod = await moderator("mod-create");
    const before = await library();
    const res = await create(mod, "exercise", exercise);
    expect(res.status).toBe(201);
    const entry = res.body["entry"] as LibraryEntry;
    expect(entry).toMatchObject({
      type: "exercise",
      id: "pullUpNegatives",
      status: "active",
      translations: { de: { name: "Negative Klimmzüge" } },
      spec: { kind: "strength", measure: "reps" },
    });
    const after = await library();
    expect(after.exercises.at(-1)!.id).toBe("pullUpNegatives");
    expect(after.exercises).toHaveLength(before.exercises.length + 1);
    const changes = (await call(mod, "/v1/moderation/library/exercise/pullUpNegatives")).body[
      "changes"
    ] as { id: string; before: { name: string } }[];
    expect(changes).toHaveLength(1);
    expect(changes[0]!.before.name).toBe("");
    const restore = await call(mod, `/v1/moderation/library/changes/${changes[0]!.id}/restore`, {
      method: "POST",
    });
    expect(restore.status).toBe(400);

    const again = await create(mod, "exercise", { ...exercise, name: "Pull up, negatives" });
    expect(again.status).toBe(409);
    expect(again.body["id"]).toBe("pullUpNegatives");
  });

  it("refuses a retired built-in's id", async () => {
    const mod = await moderator("mod-create");
    await env.DB.prepare(
      "UPDATE library_items SET status = 'retired' WHERE type = 'exercise' AND id = 'pullUps'"
    ).run();
    expect((await create(mod, "exercise", { ...exercise, name: "Pull-ups" })).status).toBe(409);
  });

  it("writes nothing, history included, when the id is already in the table", async () => {
    const changes = async (): Promise<unknown> =>
      (
        await env.DB.prepare(
          "SELECT count(*) AS n FROM library_changes WHERE item_type = 'exercise' AND item_id = 'pullUps'"
        ).first()
      )?.["n"];
    const before = await changes();
    const made = await repo.createLibraryEntry(env.DB, "mod-create", {
      ...repo.UNCREATED,
      name: "Pull-ups",
      type: "exercise",
      id: "pullUps",
      spec: { kind: "strength", measure: "reps" },
    });
    expect(made).toBeNull();
    expect(await changes()).toBe(before);
  });

  it("refuses a negative or fractional number", async () => {
    const mod = await moderator("mod-create");
    const workout = (dose: Record<string, number>, minutes = 30) => ({
      name: "Bad numbers",
      description: "",
      names: {},
      spec: {
        kind: "strength",
        focus: null,
        minutes,
        targetRpe: 7,
        items: [{ exercise: "pullUps", doses: [dose] }],
      },
    });
    expect((await create(mod, "workout", workout({ sets: 3, reps: -5 }))).status).toBe(400);
    expect((await create(mod, "workout", workout({ sets: 2.5 }))).status).toBe(400);
    expect((await create(mod, "workout", workout({ sets: 3 }, 30.5))).status).toBe(400);
    expect(
      (
        await create(mod, "exercise", {
          ...exercise,
          spec: { ...exercise.spec, dose: { sets: 0 } },
        })
      ).status
    ).toBe(400);
  });

  it("takes every seeded spec but the empty first run plan, so the bounds fit what ships", async () => {
    const lib = await library();
    const ids = new Set(lib.exercises.map((e) => e.id));
    const workouts = lib.workouts.filter((w) => w.spec.items.length > 0);
    expect(lib.workouts.length - workouts.length).toBe(1);
    for (const e of [...lib.exercises, ...workouts])
      expect(createdSpec(e.type === "exercise" ? "exercise" : "workout", e.spec, ids)).toEqual({
        spec: e.spec,
      });
  });

  it("refuses a measure its kind does not take", async () => {
    const mod = await moderator("mod-create");
    const res = await create(mod, "exercise", {
      ...exercise,
      spec: { kind: "climbing", measure: "repsWeight" },
    });
    expect(res.status).toBe(400);
  });

  it("adds a workout of built-in exercises, and refuses an unknown exercise or a stray grip", async () => {
    const mod = await moderator("mod-create");
    const workout = {
      name: "Pull day",
      description: "",
      names: {},
      spec: {
        kind: "strength",
        focus: "strength",
        minutes: 45,
        targetRpe: 8,
        items: [{ exercise: "pullUps", doses: [{ sets: 3, reps: 5 }] }],
      },
    };
    const res = await create(mod, "workout", workout);
    expect(res.status).toBe(201);
    expect((res.body["entry"] as LibraryEntry).id).toBe("strength-pull-day");
    expect((await library()).workouts.at(-1)!.id).toBe("strength-pull-day");

    const unknown = await create(mod, "workout", {
      ...workout,
      name: "Other pull day",
      spec: { ...workout.spec, items: [{ exercise: "nope", doses: [{ sets: 1 }] }] },
    });
    expect(unknown.status).toBe(400);
    const grip = await create(mod, "workout", {
      ...workout,
      name: "Grip day",
      spec: { ...workout.spec, items: [{ grip: "half", doses: [{ sets: 1 }] }] },
    });
    expect(grip.status).toBe(400);
  });
});

describe("the Climbing day first run plans", () => {
  it("is served as a built-in climbing workout with nothing to play, in every language", async () => {
    const { status, body } = await call(null, "/v1/library");
    expect(status).toBe(200);
    const climbing = (body.library as BuiltInLibrary).workouts.find(
      (w) => w.id === "climb-session"
    );
    expect(climbing).toMatchObject({
      name: "Climbing",
      status: "active",
      spec: { kind: "climbing", focus: null, minutes: null, targetRpe: null, items: [] },
      translations: {
        de: { name: "Klettern" },
        fr: { name: "Escalade" },
        es: { name: "Escalada" },
      },
    });
  });
});

const JPEG = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 4]);

const upload = async (
  user: string,
  path: string,
  files: { picture?: File; thumb?: File; width?: string } = {}
): Promise<{ status: number; body: Record<string, unknown> }> => {
  const form = new FormData();
  form.set("picture", files.picture ?? new File([JPEG], "wall.jpg", { type: "image/jpeg" }));
  form.set("thumb", files.thumb ?? new File([JPEG], "wall-144.jpg", { type: "image/jpeg" }));
  form.set("width", files.width ?? "1600");
  form.set("height", "1200");
  const res = await testApp().request(
    path,
    { method: "POST", headers: { "x-test-user": user }, body: form },
    env
  );
  return { status: res.status, body: (await res.json()) as Record<string, unknown> };
};

type ModerationMedia = { id: string; alt: string; url: string; thumbUrl: string };

const moderationMedia = async (mod: string, item: string): Promise<ModerationMedia[]> =>
  (await call(mod, `/v1/moderation/library/${item}`)).body["media"] as ModerationMedia[];

const workout = async (id: string): Promise<LibraryEntry> =>
  (await library()).workouts.find((w) => w.id === id)!;

describe("library pictures", () => {
  it("stores the two sizes, and keeps a picture out of the apps until it has alt text", async () => {
    const mod = await moderator("mod-pic-1");
    const added = await upload(mod, "/v1/moderation/library/workout/max10/media");
    expect(added.status).toBe(201);
    const [picture] = await moderationMedia(mod, "workout/max10");
    expect(picture!.url).toMatch(
      /^https:\/\/media\.sendtally\.test\/library\/workout\/max10\/.+-1600\.jpg$/
    );
    expect(picture!.thumbUrl).toMatch(/-144\.jpg$/);
    const key = picture!.url.slice("https://media.sendtally.test/".length);
    const stored = await env.MEDIA.head(key);
    expect(stored?.httpMetadata?.cacheControl).toBe("public, max-age=31536000, immutable");
    expect((await workout("max10")).media).toEqual([]);

    expect(
      (
        await call(mod, `/v1/moderation/library/media/${picture!.id}`, {
          method: "PATCH",
          body: { alt: "Four fingers on a wooden edge", credit: "Photo · sendtally" },
        })
      ).status
    ).toBe(200);
    expect((await workout("max10")).media).toEqual([
      {
        kind: "picture",
        url: picture!.url,
        thumbUrl: picture!.thumbUrl,
        width: 1600,
        height: 1200,
        alt: "Four fingers on a wooden edge",
        credit: "Photo · sendtally",
      },
    ]);
  });

  it("refuses what is not a picture, or too large, with the line moderation shows", async () => {
    const mod = await moderator("mod-pic-2");
    const path = "/v1/moderation/library/workout/rep73/media";
    const heic = new File([JPEG], "wall.heic", { type: "image/heic" });
    expect((await upload(mod, path, { picture: heic })).body).toEqual({
      error: "Use JPEG, PNG or WebP",
    });
    const fake = new File(["not a picture"], "wall.png", { type: "image/png" });
    expect((await upload(mod, path, { thumb: fake })).body["error"]).toBe("Use JPEG, PNG or WebP");
    const big = new File([JPEG, new Uint8Array(5 * 1024 * 1024)], "wall.jpg", {
      type: "image/jpeg",
    });
    expect((await upload(mod, path, { picture: big })).body["error"]).toBe("Too large");
    expect((await upload(mod, path, { width: "wide" })).status).toBe(400);
    expect((await upload("climber", path)).status).toBe(403);
    expect(await moderationMedia(mod, "workout/rep73")).toEqual([]);
  });

  it("refuses a body over the upload limit before reading it", async () => {
    const mod = await moderator("mod-pic-5");
    const huge = new File([JPEG, new Uint8Array(7 * 1024 * 1024)], "wall.jpg", {
      type: "image/jpeg",
    });
    const refused = await upload(mod, "/v1/moderation/library/grip/drag/media", { picture: huge });
    expect(refused).toEqual({ status: 413, body: { error: "Too large" } });
  });

  it("removes the files again when the row cannot be written", async () => {
    const mod = await moderator("mod-pic-6");
    const failing = vi.spyOn(env.DB, "batch").mockRejectedValueOnce(new Error("D1 down"));
    const failed = await upload(mod, "/v1/moderation/library/grip/pinch/media");
    failing.mockRestore();
    expect(failed.status).toBe(500);
    expect((await env.MEDIA.list({ prefix: "library/grip/pinch/" })).objects).toEqual([]);
    expect(await moderationMedia(mod, "grip/pinch")).toEqual([]);
  });

  it("serves the bucket only where the media host is the API itself", async () => {
    const res = await testApp().request("/media/library/grip/half/x-1600.jpg", {}, env);
    expect(res.status).toBe(404);
  });

  it("moves a picture, and restores the order it had", async () => {
    const mod = await moderator("mod-pic-3");
    const path = "/v1/moderation/library/grip/open/media";
    await upload(mod, path);
    await upload(mod, path);
    const [first, second] = await moderationMedia(mod, "grip/open");
    for (const [m, alt] of [
      [first!, "First"],
      [second!, "Second"],
    ] as const)
      await call(mod, `/v1/moderation/library/media/${m.id}`, { method: "PATCH", body: { alt } });
    await call(mod, `/v1/moderation/library/media/${second!.id}`, {
      method: "PATCH",
      body: { position: 0 },
    });
    const alts = async (): Promise<string[]> =>
      (await library()).grips.find((g) => g.id === "open")!.media.map((m) => m.alt);
    expect(await alts()).toEqual(["Second", "First"]);

    const [moved] = (await call(mod, "/v1/moderation/library/grip/open")).body["changes"] as {
      id: string;
    }[];
    await call(mod, `/v1/moderation/library/changes/${moved!.id}/restore`, { method: "POST" });
    expect(await alts()).toEqual(["First", "Second"]);
  });

  it("deletes the files before the row, so a failed file delete keeps the row", async () => {
    const mod = await moderator("mod-pic-4");
    await upload(mod, "/v1/moderation/library/grip/sloper/media");
    const [picture] = await moderationMedia(mod, "grip/sloper");
    const key = picture!.url.slice("https://media.sendtally.test/".length);

    const failing = vi.spyOn(env.MEDIA, "delete").mockRejectedValueOnce(new Error("R2 down"));
    const failed = await testApp().request(
      `/v1/moderation/library/media/${picture!.id}`,
      { method: "DELETE", headers: { "x-test-user": mod } },
      env
    );
    expect(failed.status).toBe(500);
    expect(await moderationMedia(mod, "grip/sloper")).toHaveLength(1);
    failing.mockRestore();

    const deleted = await call(mod, `/v1/moderation/library/media/${picture!.id}`, {
      method: "DELETE",
    });
    expect(deleted.status).toBe(200);
    expect(await env.MEDIA.head(key)).toBeNull();
    expect(await moderationMedia(mod, "grip/sloper")).toEqual([]);
    const [change] = (await call(mod, "/v1/moderation/library/grip/sloper")).body["changes"] as {
      before: { media: unknown[] };
      after: { media: unknown[] };
    }[];
    expect(change!.before.media).toHaveLength(1);
    expect(change!.after.media).toEqual([]);
  });
});
