import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { INSIGHTS_FEATURE, STORE_ENTITLEMENT } from "../src/features";
import { storeEntitlementsOf, webhookUserIds } from "../src/lib/revenuecat";
import { jsonResponse, makeFakeFetch, type RecordedCall } from "./fakes";

const FUTURE = "2099-01-01T00:00:00Z";
const PAST = "2001-01-01T00:00:00Z";

function subscriber(overrides: {
  expires?: string | null;
  grace?: string | null;
  unsubscribed?: string | null;
  billingIssue?: string | null;
  store?: string;
  entitlement?: string;
}) {
  return {
    request_date: "2026-09-08T00:00:00Z",
    subscriber: {
      original_app_user_id: "user_x",
      management_url: "https://play.google.com/store/account/subscriptions",
      entitlements: {
        [overrides.entitlement ?? STORE_ENTITLEMENT]: {
          expires_date: overrides.expires === undefined ? FUTURE : overrides.expires,
          grace_period_expires_date: overrides.grace ?? null,
          product_identifier: "member_monthly",
          purchase_date: "2026-09-01T00:00:00Z",
        },
      },
      subscriptions: {
        member_monthly: {
          store: overrides.store ?? "play_store",
          expires_date: overrides.expires === undefined ? FUTURE : overrides.expires,
          purchase_date: "2026-09-01T00:00:00Z",
          unsubscribe_detected_at: overrides.unsubscribed ?? null,
          billing_issues_detected_at: overrides.billingIssue ?? null,
          period_type: "normal",
        },
      },
      non_subscriptions: {},
    },
  };
}

function revenueCatFetch(
  bodies: Record<string, unknown>,
  status = 200
): { fetchImpl: typeof fetch; calls: RecordedCall[] } {
  return makeFakeFetch([
    {
      match: (url) => url.startsWith("https://api.revenuecat.com/v1/subscribers/"),
      respond: (url, method) => {
        if (method === "DELETE") return jsonResponse(200, { deleted: true });
        const id = decodeURIComponent(url.split("/subscribers/")[1] ?? "");
        const body = bodies[id];
        return body === undefined ? jsonResponse(500, {}) : jsonResponse(status, body);
      },
    },
  ]);
}

function testApp(fetchImpl: typeof fetch) {
  return createApp({
    verifyUser: async (req) => {
      const userId = req.headers.get("x-test-user");
      if (userId === null) return null;
      const features = (req.headers.get("x-test-features") ?? "").split(",");
      return { userId, hasFeature: (feature) => features.includes(feature) };
    },
    deleteAuthUser: async () => {},
    verifyAuthWebhook: async () => {
      throw new Error("unsigned webhook");
    },
    fetchImpl,
  });
}

function webhook(event: Record<string, unknown>, auth = "test-revenuecat-webhook-auth") {
  return {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: auth },
    body: JSON.stringify({ api_version: "1.0", event }),
  };
}

async function entitlements(app: ReturnType<typeof testApp>, userId: string, features = "") {
  const res = await app.request(
    "/v1/entitlements",
    { headers: { "x-test-user": userId, "x-test-features": features } },
    env
  );
  expect(res.status).toBe(200);
  return (await res.json()) as {
    membership: {
      active: boolean;
      web: boolean;
      store: {
        store: string;
        productId: string;
        expiresAt: string | null;
        willRenew: boolean;
      } | null;
    };
  };
}

describe("storeEntitlementsOf", () => {
  it("maps an active subscription to a renewing entitlement", () => {
    const [row] = storeEntitlementsOf(subscriber({}).subscriber);
    expect(row).toEqual({
      entitlement: STORE_ENTITLEMENT,
      store: "play_store",
      product_id: "member_monthly",
      expires_at: FUTURE,
      will_renew: true,
    });
  });

  it("keeps the entitlement alive through the grace period", () => {
    const [row] = storeEntitlementsOf(subscriber({ expires: PAST, grace: FUTURE }).subscriber);
    expect(row?.expires_at).toBe(FUTURE);
  });

  it("stops renewing once the user unsubscribes or billing fails", () => {
    expect(
      storeEntitlementsOf(subscriber({ unsubscribed: "2026-09-02T00:00:00Z" }).subscriber)[0]
        ?.will_renew
    ).toBe(false);
    expect(
      storeEntitlementsOf(subscriber({ billingIssue: "2026-09-02T00:00:00Z" }).subscriber)[0]
        ?.will_renew
    ).toBe(false);
  });

  it("treats a null expiry as a lifetime entitlement", () => {
    const [row] = storeEntitlementsOf(subscriber({ expires: null }).subscriber);
    expect(row?.expires_at).toBeNull();
  });
});

describe("webhookUserIds", () => {
  it("ignores dashboard test events", () => {
    expect(webhookUserIds({ type: "TEST", app_user_id: "test-id" })).toEqual([]);
  });

  it("covers both sides of a transfer", () => {
    expect(
      webhookUserIds({
        type: "TRANSFER",
        transferred_from: ["user_a"],
        transferred_to: ["user_b", "user_a"],
      })
    ).toEqual(["user_a", "user_b"]);
  });
});

describe("RevenueCat webhook", () => {
  it("rejects a request without the shared authorization header", async () => {
    const { fetchImpl } = revenueCatFetch({});
    const res = await testApp(fetchImpl).request(
      "/webhooks/revenuecat",
      webhook({ type: "INITIAL_PURCHASE", app_user_id: "user_rc_1" }, "wrong"),
      env
    );
    expect(res.status).toBe(401);
  });

  it("acknowledges the dashboard test event without touching RevenueCat", async () => {
    const { fetchImpl, calls } = revenueCatFetch({});
    const res = await testApp(fetchImpl).request(
      "/webhooks/revenuecat",
      webhook({ type: "TEST", app_user_id: "test" }),
      env
    );
    expect(res.status).toBe(200);
    expect(calls).toHaveLength(0);
  });

  it("mirrors the subscriber into D1 and the entitlement endpoint reads it back", async () => {
    const { fetchImpl } = revenueCatFetch({ user_rc_2: subscriber({}) });
    const app = testApp(fetchImpl);
    const res = await app.request(
      "/webhooks/revenuecat",
      webhook({ type: "INITIAL_PURCHASE", app_user_id: "user_rc_2" }),
      env
    );
    expect(res.status).toBe(200);

    const { membership } = await entitlements(app, "user_rc_2");
    expect(membership).toEqual({
      active: true,
      web: false,
      store: {
        store: "play_store",
        productId: "member_monthly",
        expiresAt: FUTURE,
        willRenew: true,
      },
    });
  });

  it("drops an expired entitlement from the answer", async () => {
    const { fetchImpl } = revenueCatFetch({ user_rc_3: subscriber({ expires: PAST }) });
    const app = testApp(fetchImpl);
    await app.request(
      "/webhooks/revenuecat",
      webhook({ type: "EXPIRATION", app_user_id: "user_rc_3" }),
      env
    );
    const { membership } = await entitlements(app, "user_rc_3");
    expect(membership).toEqual({ active: false, web: false, store: null });
  });

  it("mirrors every user involved in a transfer", async () => {
    const { fetchImpl, calls } = revenueCatFetch({
      user_rc_from: subscriber({ expires: PAST }),
      user_rc_to: subscriber({}),
    });
    const app = testApp(fetchImpl);
    const res = await app.request(
      "/webhooks/revenuecat",
      webhook({
        type: "TRANSFER",
        transferred_from: ["user_rc_from"],
        transferred_to: ["user_rc_to"],
      }),
      env
    );
    expect(res.status).toBe(200);
    expect(calls.map((c) => c.url.split("/subscribers/")[1])).toEqual([
      "user_rc_from",
      "user_rc_to",
    ]);
    expect((await entitlements(app, "user_rc_to")).membership.active).toBe(true);
    expect((await entitlements(app, "user_rc_from")).membership.active).toBe(false);
  });

  it("fails loudly when RevenueCat cannot be read, so the event is retried", async () => {
    const { fetchImpl } = revenueCatFetch({});
    const res = await testApp(fetchImpl).request(
      "/webhooks/revenuecat",
      webhook({ type: "RENEWAL", app_user_id: "user_rc_missing" }),
      env
    );
    expect(res.status).toBe(500);
  });
});

describe("GET /v1/entitlements", () => {
  it("answers from the auth provider when there is no store row", async () => {
    const { fetchImpl } = revenueCatFetch({});
    const { membership } = await entitlements(testApp(fetchImpl), "user_web_1", INSIGHTS_FEATURE);
    expect(membership).toEqual({ active: true, web: true, store: null });
  });

  it("is inactive for a user with neither", async () => {
    const { fetchImpl } = revenueCatFetch({});
    const { membership } = await entitlements(testApp(fetchImpl), "user_none_1");
    expect(membership).toEqual({ active: false, web: false, store: null });
  });
});

describe("POST /v1/entitlements/refresh", () => {
  it("pulls the subscriber on demand and answers with the merged view", async () => {
    const { fetchImpl, calls } = revenueCatFetch({
      user_refresh_1: subscriber({ unsubscribed: "2026-09-02T00:00:00Z" }),
    });
    const res = await testApp(fetchImpl).request(
      "/v1/entitlements/refresh",
      { method: "POST", headers: { "x-test-user": "user_refresh_1" } },
      env
    );
    expect(res.status).toBe(200);
    expect(calls).toHaveLength(1);
    expect(calls[0]?.headers["authorization"]).toBe("Bearer test-revenuecat-secret");
    const body = (await res.json()) as { membership: { store: { willRenew: boolean } | null } };
    expect(body.membership.store?.willRenew).toBe(false);
  });
});

describe("account deletion", () => {
  it("forgets the RevenueCat subscriber and drops the mirrored rows", async () => {
    const { fetchImpl, calls } = revenueCatFetch({ user_del_1: subscriber({}) });
    const app = testApp(fetchImpl);
    await app.request(
      "/webhooks/revenuecat",
      webhook({ type: "INITIAL_PURCHASE", app_user_id: "user_del_1" }),
      env
    );
    const res = await app.request(
      "/v1/account",
      { method: "DELETE", headers: { "x-test-user": "user_del_1" } },
      env
    );
    expect(res.status).toBe(200);
    expect(calls.some((c) => c.method === "DELETE" && c.url.endsWith("/user_del_1"))).toBe(true);
    const row = await env.DB.prepare(
      `SELECT COUNT(*) AS n FROM store_entitlements WHERE user_id = 'user_del_1'`
    ).first<{ n: number }>();
    expect(row?.n).toBe(0);
  });
});
