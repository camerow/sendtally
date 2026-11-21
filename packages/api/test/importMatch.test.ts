import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import type { Env } from "../src/bindings";
import { testApp } from "./harness";

const body = {
  header: ["When", "Problem", "Grade", "Sent?", "Shoes"],
  rows: [["03/04/22", "The Hulk", "V6", "y", "Solution"]],
};

const answer = {
  date: "When",
  climb: "Problem",
  grade: { column: "Grade", scale: "v" },
  otherGrade: null,
  result: { column: "Sent?", values: [{ value: "y", means: "send" }] },
  tries: null,
  where: null,
  notes: null,
};

const allowed = { limit: async () => ({ success: true }) };

const withModel = (response: unknown, calls: unknown[] = []): Env => ({
  ...env,
  IMPORT_MATCH_RATE_LIMITER: allowed,
  AI: {
    run: async (_model: string, input: unknown) => {
      calls.push(input);
      if (response instanceof Error) throw response;
      return { response, usage: { prompt_tokens: 900, completion_tokens: 120 } };
    },
  } as unknown as Ai,
});

const match = (user: string, testEnv: Env, json: unknown = body) =>
  testApp().request(
    "/v1/import/match",
    {
      method: "POST",
      headers: { "x-test-user": user, "Content-Type": "application/json" },
      body: JSON.stringify(json),
    },
    testEnv
  );

describe("POST /v1/import/match", () => {
  it("answers the model's match and sends it only the header and the sample", async () => {
    const calls: unknown[] = [];
    const res = await match("user_match", withModel(answer, calls));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ match: answer });
    expect(JSON.stringify(calls)).toContain("The Hulk");
    expect(calls).toHaveLength(1);
  });

  it("reads an answer the model wrote as a JSON string", async () => {
    const res = await match("user_match_text", withModel(JSON.stringify(answer)));
    expect(await res.json()).toEqual({ match: answer });
  });

  it("answers no match for a sheet with no date or grade, or a column the sheet lacks", async () => {
    for (const response of [
      { ...answer, date: null },
      { ...answer, notes: "Diary" },
      { nonsense: true },
      new Error("JSON Mode couldn't be met"),
    ]) {
      const res = await match("user_match_none", withModel(response));
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ match: null });
    }
  });

  it("refuses more than 20 rows", async () => {
    const rows = Array.from({ length: 21 }, () => ["2024-01-01", "x", "V1", "y", ""]);
    const res = await match("user_match_rows", withModel(answer), { ...body, rows });
    expect(res.status).toBe(400);
  });

  it("answers 429 after 20 matches in a day, and on a burst", async () => {
    const calls: unknown[] = [];
    const testEnv = withModel(answer, calls);
    for (let i = 0; i < 20; i++) expect((await match("user_match_day", testEnv)).status).toBe(200);
    expect((await match("user_match_day", testEnv)).status).toBe(429);
    expect(calls).toHaveLength(20);

    const burst = {
      ...withModel(answer),
      IMPORT_MATCH_RATE_LIMITER: { limit: async () => ({ success: false }) },
    };
    expect((await match("user_match_burst", burst)).status).toBe(429);
  });
});
