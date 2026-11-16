import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import type { BuiltInLibrary, LibraryEntry } from "@sendtally/core/hang";
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

    const changes = (await call(mod, "/v1/moderation/library/grip/half/changes")).body[
      "changes"
    ] as { id: string; changedBy: string; before: { status: string; description: string } }[];
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
      ((await call(mod, "/v1/moderation/library/grip/half/changes")).body["changes"] as unknown[])
        .length
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
