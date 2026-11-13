import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { testApp } from "./harness";

const rpc = async (method: string, params: unknown, user?: string): Promise<Response> =>
  testApp().request(
    "https://api.sendtally.test/mcp",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
        ...(user === undefined ? {} : { "x-test-user": user }),
      },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    },
    env
  );

describe("connector", () => {
  it("sends an unsigned client to the Clerk instance that signs it in", async () => {
    const res = await rpc("tools/list", {});
    expect(res.status).toBe(401);
    const challenge = res.headers.get("WWW-Authenticate") ?? "";
    const metadataUrl = /resource_metadata="([^"]+)"/.exec(challenge)?.[1] ?? "";
    expect(metadataUrl).toBe("https://api.sendtally.test/.well-known/oauth-protected-resource/mcp");

    const metadata = await testApp().request(metadataUrl, {}, env);
    expect(await metadata.json()).toMatchObject({
      resource: "https://api.sendtally.test/mcp",
      authorization_servers: ["https://clerk.sendtally.test"],
    });
  });

  it("lists only the signed-in user's sessions", async () => {
    await testApp().request(
      "/v1/sessions",
      {
        method: "POST",
        headers: { "x-test-user": "user_mcp", "Content-Type": "application/json" },
        body: JSON.stringify({
          date: "2026-11-01",
          name: "Tuesday night session",
          startTime: "18:00",
          endTime: "19:30",
          location: "indoor",
          climbs: [{ name: "", grade: { scale: "v", value: 4 }, kind: "send", tries: 1 }],
        }),
      },
      env
    );
    const call = { name: "list_sessions", arguments: {} };
    const sessionsOf = async (user: string): Promise<unknown[]> => {
      const res = await rpc("tools/call", call, user);
      const body = (await res.json()) as { result: { content: Array<{ text: string }> } };
      return (JSON.parse(body.result.content[0]?.text ?? "{}") as { sessions: unknown[] }).sessions;
    };
    expect(await sessionsOf("user_mcp")).toMatchObject([{ topGrade: "V4" }]);
    expect(await sessionsOf("user_other")).toEqual([]);
  });
});
