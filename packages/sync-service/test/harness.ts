import { vi } from "vitest";
import { app } from "../src/app";
import { auth } from "../src/auth";
import { jsonResponse, makeFakeFetch } from "./fakes";

// Tests never reach the network: anything a test does not stub throws inside
// the fake. Account deletion always forgets the RevenueCat subscriber, so that
// one call is answered here rather than in every deletion test.
export const offlineFetch = makeFakeFetch([
  {
    match: (url, method) => method === "DELETE" && url.startsWith("https://api.revenuecat.com/"),
    respond: () => jsonResponse(200, { deleted: true }),
  },
]).fetchImpl;

export type AuthOverrides = Partial<Pick<typeof auth, "deleteUser" | "verifyWebhook">>;

// A test picks its case by naming the signed-in user in a header and swapping
// the calls that leave the Worker, not by constructing a different app.
export function testApp(
  fetchImpl: typeof fetch = offlineFetch,
  overrides: AuthOverrides = {}
): typeof app {
  vi.stubGlobal("fetch", fetchImpl);
  auth.verifyUser = async (req) => {
    const userId = req.headers.get("x-test-user");
    if (userId === null) return null;
    const features = (req.headers.get("x-test-features") ?? "").split(",");
    return { userId, hasFeature: (feature) => features.includes(feature) };
  };
  auth.deleteUser = overrides.deleteUser ?? (async () => undefined);
  auth.verifyWebhook =
    overrides.verifyWebhook ??
    (async () => {
      throw new Error("unsigned webhook");
    });
  return app;
}
