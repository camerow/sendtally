import { z } from "zod";

const BASE_URL = "https://api.revenuecat.com/v1";

const isoDate = z.string().nullable().optional();

const subscriberResponse = z.object({
  subscriber: z.object({
    entitlements: z
      .record(
        z.string(),
        z.object({
          expires_date: z.string().nullable(),
          grace_period_expires_date: isoDate,
          product_identifier: z.string(),
        })
      )
      .default({}),
    subscriptions: z
      .record(
        z.string(),
        z.object({
          store: z.string(),
          unsubscribe_detected_at: isoDate,
          billing_issues_detected_at: isoDate,
        })
      )
      .default({}),
    non_subscriptions: z.record(z.string(), z.array(z.object({ store: z.string() }))).default({}),
    management_url: z.string().nullable().optional(),
  }),
});

type SubscriberPayload = z.infer<typeof subscriberResponse>["subscriber"];

export type StoreEntitlement = {
  entitlement: string;
  store: string;
  product_id: string;
  expires_at: string | null;
  will_renew: boolean;
};

export type Subscriber = {
  entitlements: StoreEntitlement[];
  managementUrl: string | null;
};

export const webhookBody = z.object({
  event: z.object({
    type: z.string(),
    app_user_id: z.string().optional(),
    transferred_from: z.array(z.string()).optional(),
    transferred_to: z.array(z.string()).optional(),
  }),
});

export type WebhookEvent = z.infer<typeof webhookBody>["event"];

export function webhookUserIds(event: WebhookEvent): string[] {
  if (event.type === "TEST") return [];
  const ids = [
    event.app_user_id,
    ...(event.transferred_from ?? []),
    ...(event.transferred_to ?? []),
  ];
  return [...new Set(ids.filter((id): id is string => id !== undefined && id !== ""))];
}

function laterOf(a: string | null, b: string | null | undefined): string | null {
  if (a === null) return null;
  if (b === null || b === undefined) return a;
  return Date.parse(b) > Date.parse(a) ? b : a;
}

function storeFor(subscriber: SubscriberPayload, productId: string): string {
  const subscription = subscriber.subscriptions[productId];
  if (subscription !== undefined) return subscription.store;
  const oneOff = subscriber.non_subscriptions[productId]?.at(-1);
  return oneOff?.store ?? "unknown";
}

export function storeEntitlementsOf(subscriber: SubscriberPayload): StoreEntitlement[] {
  return Object.entries(subscriber.entitlements).map(([entitlement, info]) => {
    const subscription = subscriber.subscriptions[info.product_identifier];
    return {
      entitlement,
      store: storeFor(subscriber, info.product_identifier),
      product_id: info.product_identifier,
      expires_at: laterOf(info.expires_date, info.grace_period_expires_date),
      will_renew:
        subscription !== undefined &&
        subscription.unsubscribe_detected_at == null &&
        subscription.billing_issues_detected_at == null,
    };
  });
}

export class RevenueCatClient {
  constructor(private readonly secretKey: string) {}

  private subscriberUrl(appUserId: string): string {
    return `${BASE_URL}/subscribers/${encodeURIComponent(appUserId)}`;
  }

  private headers(): Record<string, string> {
    return { Authorization: `Bearer ${this.secretKey}`, Accept: "application/json" };
  }

  async fetchSubscriber(appUserId: string): Promise<Subscriber> {
    const resp = await fetch(this.subscriberUrl(appUserId), { headers: this.headers() });
    if (!resp.ok) throw new Error(`revenuecat subscriber fetch failed: HTTP ${resp.status}`);
    const { subscriber } = subscriberResponse.parse(await resp.json());
    return {
      entitlements: storeEntitlementsOf(subscriber),
      managementUrl: subscriber.management_url ?? null,
    };
  }

  // 404 is success here: the subscriber never existed or was already removed.
  async deleteSubscriber(appUserId: string): Promise<void> {
    const resp = await fetch(this.subscriberUrl(appUserId), {
      method: "DELETE",
      headers: this.headers(),
    });
    if (!resp.ok && resp.status !== 404) {
      throw new Error(`revenuecat subscriber delete failed: HTTP ${resp.status}`);
    }
  }
}
