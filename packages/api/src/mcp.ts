import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CfWorkerJsonSchemaValidator } from "@modelcontextprotocol/sdk/validation/cfworker-provider.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { z } from "zod";
import { auth } from "./auth";
import type { Env } from "./bindings";
import type { AppEnv } from "./context";
import * as repo from "./lib/repo";

const METADATA_PATH = "/.well-known/oauth-protected-resource/mcp";

// A publishable key is its prefix and the base64 of the instance's host, "$"-terminated.
export const clerkIssuer = (publishableKey: string): string =>
  `https://${atob(publishableKey.split("_")[2] ?? "").slice(0, -1)}`;

function serverFor(env: Env, userId: string): McpServer {
  // The SDK's default validator compiles schemas with new Function, which Workers forbid.
  const server = new McpServer(
    { name: "sendtally", version: "1.0.0" },
    { jsonSchemaValidator: new CfWorkerJsonSchemaValidator() }
  );
  server.registerTool(
    "list_sessions",
    {
      title: "List climbing sessions",
      description:
        "The user's logged climbing sessions, newest first, each with its date, title, effort (RPE 1-10) and top grades.",
      inputSchema: { limit: z.number().int().min(1).max(100).default(20) },
      annotations: { readOnlyHint: true },
    },
    async ({ limit }) => {
      const rows = await repo.listSessions(env.DB, userId);
      const sessions = rows.slice(0, limit).map((row) => ({
        id: row.fingerprint,
        startAt: row.start_at,
        title: row.title,
        rpe: row.rpe,
        topGrade: row.top_grade_label,
        topSendGrade: row.top_send_grade_label,
      }));
      return { content: [{ type: "text", text: JSON.stringify({ sessions }) }] };
    }
  );
  return server;
}

// Assistants connect here as OAuth clients of our Clerk instance. Every request
// carries its own token and builds its own server, so nothing is held between calls.
export const mcp = new Hono<AppEnv>()
  .use(
    cors({
      origin: "*",
      allowHeaders: ["Authorization", "Content-Type", "Mcp-Protocol-Version", "Mcp-Session-Id"],
      exposeHeaders: ["WWW-Authenticate", "Mcp-Session-Id"],
    })
  )
  .get(METADATA_PATH, (c) =>
    c.json({
      resource: new URL("/mcp", c.req.url).href,
      authorization_servers: [clerkIssuer(c.env.CLERK_PUBLISHABLE_KEY)],
      bearer_methods_supported: ["header"],
      scopes_supported: ["profile", "email"],
    })
  )
  .all("/mcp", async (c) => {
    const userId = await auth.verifyConnector(c.req.raw, c.env, new URL("/mcp", c.req.url).href);
    if (userId === null) {
      const metadata = new URL(METADATA_PATH, c.req.url).href;
      return c.json({ error: "unauthorized" }, 401, {
        "WWW-Authenticate": `Bearer resource_metadata="${metadata}"`,
      });
    }
    const transport = new WebStandardStreamableHTTPServerTransport({ enableJsonResponse: true });
    await serverFor(c.env, userId).connect(transport);
    return transport.handleRequest(c.req.raw);
  });
