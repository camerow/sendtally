import { PostHog } from "posthog-node";
import type { Env } from "../bindings";

let posthog: PostHog | null | undefined;

export function getPostHog(env: Env): PostHog | null {
  if (posthog !== undefined) return posthog;

  const token = env.POSTHOG_PROJECT_TOKEN;
  const host = env.POSTHOG_HOST;
  if (token === undefined || token === "" || host === undefined || host === "") {
    posthog = null;
    return posthog;
  }

  posthog = new PostHog(token, {
    host,
    enableExceptionAutocapture: true,
    flushAt: 1,
    flushInterval: 0,
  });
  return posthog;
}

// Person properties are what the project's "Internal / Test users" cohort
// matches on, so an identified email is also how our own accounts stay out of
// the numbers.
export async function identifyUser(
  env: Env,
  distinctId: string,
  properties: Record<string, string | boolean>
): Promise<void> {
  const posthog = getPostHog(env);
  if (posthog === null) return;
  posthog.identify({ distinctId, properties });
  await posthog.flush();
}

export async function captureUserEvent(
  env: Env,
  distinctId: string,
  event: string,
  properties: Record<string, string | boolean> = {}
): Promise<void> {
  const posthog = getPostHog(env);
  if (posthog === null) return;
  posthog.capture({ distinctId, event, properties });
  await posthog.flush();
}
