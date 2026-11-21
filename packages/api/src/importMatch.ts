import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { type AppEnv, captureEvent, invalidBody } from "./context";
import {
  MATCH_MODEL,
  MATCHES_PER_DAY,
  matchBody,
  matchOf,
  matchPrompt,
  responseFormat,
} from "./lib/importMatch";
import * as repo from "./lib/repo";

type Usage = { prompt_tokens?: number; completion_tokens?: number };

// The sample is the user's logbook: it goes to Workers AI and nowhere else, never to a log.
export const importMatch = new Hono<AppEnv>().post(
  "/match",
  zValidator("json", matchBody, invalidBody),
  async (c) => {
    const userId = c.get("userId");
    const body = c.req.valid("json");
    const requested = (
      outcome: "matched" | "no_match" | "invalid" | "limited",
      usage: Usage = {}
    ): Promise<void> =>
      captureEvent(c, "import_columns_requested", {
        outcome,
        input_tokens: usage.prompt_tokens ?? 0,
        output_tokens: usage.completion_tokens ?? 0,
        model: MATCH_MODEL,
      });

    const { success } = await c.env.IMPORT_MATCH_RATE_LIMITER.limit({ key: userId });
    const day = new Date().toISOString().slice(0, 10);
    if (!success || (await repo.countAiUse(c.env.DB, userId, day)) > MATCHES_PER_DAY) {
      await requested("limited");
      return c.json({ error: "column matching limit reached" as const }, 429);
    }

    let output: { response?: unknown; usage?: Usage } | undefined;
    try {
      output = (await c.env.AI.run(MATCH_MODEL, {
        messages: matchPrompt(body),
        response_format: responseFormat,
        temperature: 0,
        max_tokens: 1024,
      })) as typeof output;
    } catch (err) {
      console.error(`column match failed: ${err instanceof Error ? err.name : "unknown"}`);
    }
    const match = matchOf(output?.response, body.header);
    if (match === null || match === "no_match") {
      await requested(match === null ? "invalid" : "no_match", output?.usage);
      return c.json({ match: null });
    }
    await requested("matched", output?.usage);
    return c.json({ match });
  }
);
