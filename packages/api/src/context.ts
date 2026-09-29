import type { zValidator } from "@hono/zod-validator";
import type { Context } from "hono";
import type { Env } from "./bindings";
import type { PostResult } from "./lib/posting";
import { captureUserEvent } from "./lib/posthog";

type Vars = { userId: string; hasFeature: (feature: string) => boolean };

export type AppEnv = { Bindings: Env; Variables: Vars };

// Every validated body answers the same way, so the shape a client sees for a
// rejected request does not depend on which endpoint rejected it.
export const invalidBody: Parameters<typeof zValidator>[2] = (result, c) =>
  result.success ? undefined : c.json({ error: "invalid request body" }, 400);

// Without a distinct id posthog-node invents a random one per call, so every
// event lands on its own anonymous person. The signed-in user id is the same
// key the browser identifies with, which is what joins the two streams.
export const captureEvent = async (
  c: Context<AppEnv>,
  event: string,
  properties: Record<string, string | number | boolean> = {},
  distinctId: string | undefined = c.get("userId")
): Promise<void> => {
  if (distinctId === undefined) return;
  await captureUserEvent(c.env, distinctId, event, properties);
};

// Posting is a Strava call or two plus a possible token refresh, so it runs
// after the response rather than making the user wait for it. Failures land in
// post_state, which the retry endpoint reads.
export const postAfterResponse = (
  c: Context<AppEnv>,
  label: string,
  sync: () => Promise<PostResult>
): void => {
  let ctx: Context<AppEnv>["executionCtx"];
  try {
    ctx = c.executionCtx;
  } catch {
    // No execution context means no background work: never start a promise that
    // would outlive the request and write after it.
    return;
  }
  ctx.waitUntil(
    sync().then(
      (result) => {
        if (result.outcome === "failed") {
          console.error(`strava post failed for ${label}: ${result.reason}`);
        }
      },
      (err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`strava post threw for ${label}: ${message}`);
      }
    )
  );
};
