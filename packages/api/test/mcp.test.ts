import { env } from "cloudflare:test";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { Env } from "../src/bindings";
import type * as harness from "./harness";
import type * as posthog from "../src/lib/posthog";

const captureUserEvent = vi.hoisted(() => vi.fn(async () => undefined));
vi.mock("../src/lib/posthog", async (importOriginal) => ({
  ...(await importOriginal<typeof posthog>()),
  captureUserEvent,
}));

// The pool loads the Worker's modules before this file's mock exists, so the app
// is imported afresh for the mock to reach the capture helper.
let testApp: typeof harness.testApp;
beforeAll(async () => {
  vi.resetModules();
  ({ testApp } = await import("./harness"));
});

type ToolResult = { isError?: boolean; content: Array<{ text: string }> };

const rpc = async (
  method: string,
  params: unknown,
  user?: string,
  bindings: Env = env
): Promise<Response> =>
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
    bindings
  );

const callTool = async (user: string, bindings: Env = env): Promise<ToolResult> => {
  const res = await rpc("tools/call", { name: "list_sessions", arguments: {} }, user, bindings);
  return ((await res.json()) as { result: ToolResult }).result;
};

describe("connector", () => {
  beforeEach(() => captureUserEvent.mockClear());

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
    const sessionsOf = async (user: string): Promise<unknown[]> => {
      const result = await callTool(user);
      return (JSON.parse(result.content[0]?.text ?? "{}") as { sessions: unknown[] }).sessions;
    };
    expect(await sessionsOf("user_mcp")).toMatchObject([{ topGrade: "V4" }]);
    expect(await sessionsOf("user_other")).toEqual([]);
  });

  it("gives every tool the title and annotations the directories require", async () => {
    const res = await rpc("tools/list", {}, "user_mcp");
    const { tools } = ((await res.json()) as { result: { tools: unknown[] } }).result;
    expect(tools.length).toBeGreaterThan(0);
    for (const tool of tools) {
      expect(tool).toMatchObject({
        title: expect.any(String),
        annotations: { readOnlyHint: expect.any(Boolean), destructiveHint: expect.any(Boolean) },
      });
    }
  });

  it("records each tool call against the user and the assistant that made it", async () => {
    await callTool("user_mcp");
    expect(captureUserEvent).toHaveBeenCalledWith(
      expect.anything(),
      "user_mcp",
      "connector_tool_called",
      { tool: "list_sessions", client: "test-client" }
    );
  });

  it("turns away a user over the rate limit without running the tool", async () => {
    const limited: Env = {
      ...env,
      CONNECTOR_RATE_LIMITER: { limit: async () => ({ success: false }) },
    };
    const result = await callTool("user_mcp", limited);
    expect(result).toMatchObject({
      isError: true,
      content: [{ text: expect.stringMatching(/Wait a minute/) }],
    });
    expect(captureUserEvent).not.toHaveBeenCalled();
  });
});
