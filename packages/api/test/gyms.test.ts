import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { testApp } from "./harness";

const headers = { "x-test-user": "user_gyms", "Content-Type": "application/json" };

const purple = { id: "c-purple", colour: "purple", label: "", low: 3, high: 5 };

describe("gyms", () => {
  it("creates, lists, edits and deletes a gym, deduping walls", async () => {
    const created = await testApp().request(
      "/v1/gyms",
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: " Boulder Barn ",
          circuits: [purple],
          walls: ["Cave", "cave", "Slab"],
        }),
      },
      env
    );
    expect(created.status).toBe(201);
    const { gym } = (await created.json()) as {
      gym: { id: string; name: string; walls: string[] };
    };
    expect(gym.name).toBe("Boulder Barn");
    expect(gym.walls).toEqual(["Cave", "Slab"]);

    const edited = await testApp().request(
      `/v1/gyms/${gym.id}`,
      {
        method: "PUT",
        headers,
        body: JSON.stringify({
          name: "Boulder Barn",
          scale: "font",
          circuits: [{ ...purple, label: "Hex 3" }],
          walls: ["Cave"],
        }),
      },
      env
    );
    expect(edited.status).toBe(200);

    const listed = await testApp().request("/v1/gyms", { headers }, env);
    const { gyms } = (await listed.json()) as { gyms: Array<Record<string, unknown>> };
    expect(gyms).toHaveLength(1);
    expect(gyms[0]).toMatchObject({ scale: "font", walls: ["Cave"] });
    expect(gyms[0]?.["circuits"]).toEqual([{ ...purple, label: "Hex 3" }]);

    const gone = await testApp().request(`/v1/gyms/${gym.id}`, { method: "DELETE", headers }, env);
    expect(gone.status).toBe(200);
    const again = await testApp().request(`/v1/gyms/${gym.id}`, { method: "DELETE", headers }, env);
    expect(again.status).toBe(404);
  });

  it("rejects a backwards circuit range", async () => {
    const res = await testApp().request(
      "/v1/gyms",
      {
        method: "POST",
        headers,
        body: JSON.stringify({ name: "Depot", circuits: [{ ...purple, low: 6, high: 2 }] }),
      },
      env
    );
    expect(res.status).toBe(400);
  });

  it("keeps a climb's circuit and wall on the session, scored at the grade sent", async () => {
    const res = await testApp().request(
      "/v1/sessions",
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          date: "2026-09-16",
          location: "indoor",
          gymId: "gym-1",
          climbs: [
            {
              grade: { scale: "v", value: 4 },
              circuit: { id: "c-purple", label: "Purple", colour: "purple" },
              wall: " Cave ",
              kind: "attempt",
              tries: 3,
            },
            { grade: { scale: "v", value: 1 }, kind: "send" },
          ],
        }),
      },
      env
    );
    expect(res.status).toBe(201);
    const { session } = (await res.json()) as {
      session: { gym_id: string | null; top_grade: number; climbs: Array<Record<string, unknown>> };
    };
    expect(session.gym_id).toBe("gym-1");
    expect(session.top_grade).toBe(4);
    expect(session.climbs[0]).toMatchObject({
      circuit: { id: "c-purple", label: "Purple", colour: "purple" },
      wall: "Cave",
      vGrade: 4,
    });
    expect(session.climbs[1]).not.toHaveProperty("circuit");
  });
});
