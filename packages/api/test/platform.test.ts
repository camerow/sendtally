import { env } from "cloudflare:test";
import { describe, expect, it, vi } from "vitest";
import * as posthog from "../src/lib/posthog";
import { testApp } from "./harness";

describe("platform on server events", () => {
  it("tags events with the client platform and ignores values it does not know", async () => {
    const capture = vi.spyOn(posthog, "captureUserEvent").mockResolvedValue();
    const start = async (user: string, client: string): Promise<number> =>
      (
        await testApp().request(
          "/v1/preferences/first-run",
          {
            method: "PUT",
            headers: {
              "x-test-user": user,
              "Content-Type": "application/json",
              "X-Sendtally-Client": client,
            },
            body: JSON.stringify({ step: "started" }),
          },
          env
        )
      ).status;
    try {
      expect(await start("user_platform", "ios")).toBe(200);
      expect(await start("user_platform_bogus", "toaster")).toBe(200);
      expect(
        capture.mock.calls
          .filter(([, , event]) => event === "first_run_started")
          .map(([, id, , properties]) => [id, properties])
      ).toEqual([
        ["user_platform", { platform: "ios" }],
        ["user_platform_bogus", {}],
      ]);
    } finally {
      capture.mockRestore();
    }
  });
});
