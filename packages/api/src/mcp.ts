import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CfWorkerJsonSchemaValidator } from "@modelcontextprotocol/sdk/validation/cfworker-provider.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { instrument } from "@posthog/mcp";
import { Hono } from "hono";
import type { PostHog } from "posthog-node";
import { cors } from "hono/cors";
import type { Context } from "hono";
import { auth, type ConnectorUser } from "./auth";
import type { AppEnv } from "./context";
import { getPostHog } from "./lib/posthog";
import { tools } from "./mcp/tools";

const METADATA_PATH = "/.well-known/oauth-protected-resource/mcp";
// Tools need only the user id, which every Clerk token carries; offline_access
// asks for a refresh token so the assistant stays signed in past the access token.
const SCOPES = ["profile", "offline_access"];

// A publishable key is its prefix and the base64 of the instance's host, "$"-terminated.
const clerkIssuer = (publishableKey: string): string =>
  `https://${atob(publishableKey.split("_")[2] ?? "").slice(0, -1)}`;

// Arguments, results, error text and the assistant's stated intent can all carry
// the user's logbook, which never goes to PostHog.
const LOGBOOK_PROPERTIES = [
  "$mcp_parameters",
  "$mcp_response",
  "$mcp_error_message",
  "$mcp_intent",
];

const RATE_LIMITED = "Too many requests from this connector. Wait a minute, then try again.";

function serverFor(c: Context<AppEnv>, user: ConnectorUser, posthog: PostHog | null): McpServer {
  // The SDK's default validator compiles schemas with new Function, which Workers forbid.
  const server = new McpServer(
    { name: "sendtally", version: "1.0.0" },
    { jsonSchemaValidator: new CfWorkerJsonSchemaValidator() }
  );
  if (posthog !== null) {
    instrument(server, posthog, {
      identify: { distinctId: user.userId },
      context: false,
      enableConversationId: false,
      enableExceptionAutocapture: false,
      beforeSend: (event) => {
        for (const key of LOGBOOK_PROPERTIES) delete event.properties[key];
        return event;
      },
    });
  }
  const ctx = { env: c.env, userId: user.userId };
  for (const { name, run, ...config } of tools) {
    server.registerTool(name, config, async (args) => {
      const { success } = await c.env.CONNECTOR_RATE_LIMITER.limit({ key: user.userId });
      if (!success) return { isError: true, content: [{ type: "text", text: RATE_LIMITED }] };
      const result = await run(args, ctx);
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    });
  }
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
      scopes_supported: SCOPES,
    })
  )
  .all("/mcp", async (c) => {
    const user = await auth.verifyConnector(c.req.raw, c.env, new URL("/mcp", c.req.url).href);
    if (user === null) {
      const metadata = new URL(METADATA_PATH, c.req.url).href;
      return c.json({ error: "unauthorized" }, 401, {
        "WWW-Authenticate": `Bearer resource_metadata="${metadata}", scope="${SCOPES.join(" ")}"`,
      });
    }
    const transport = new WebStandardStreamableHTTPServerTransport({ enableJsonResponse: true });
    const posthog = getPostHog(c.env);
    await serverFor(c, user, posthog).connect(transport);
    const response = await transport.handleRequest(c.req.raw);
    if (posthog !== null) c.executionCtx.waitUntil(posthog.flush());
    return response;
  });
