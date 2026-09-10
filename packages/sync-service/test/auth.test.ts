import { signedInAuthObject } from "@clerk/backend/internal";
import { describe, expect, it } from "vitest";
import { primaryEmail } from "../src/auth";
import { INSIGHTS_FEATURE } from "../src/features";

function claims(fea: string): Parameters<typeof signedInAuthObject>[2] {
  return {
    v: 2,
    fea,
    sub: "user_test",
    sid: "sess_test",
    iss: "https://clerk.sendtally.com",
    exp: 0,
    iat: 0,
    nbf: 0,
  } as unknown as Parameters<typeof signedInAuthObject>[2];
}

function hasFeature(fea: string, feature: string): boolean {
  return signedInAuthObject({ sessionToken: "tok" }, "tok", claims(fea)).has({ feature });
}

describe("billing claims", () => {
  it("reads user-scoped features off the session token", () => {
    const fea = `u:${INSIGHTS_FEATURE}`;
    expect(hasFeature(fea, INSIGHTS_FEATURE)).toBe(true);
  });

  it("denies features the plan does not grant", () => {
    expect(hasFeature("", INSIGHTS_FEATURE)).toBe(false);
  });
});

describe("clerk webhook email", () => {
  it("prefers the primary address", () => {
    expect(
      primaryEmail({
        primary_email_address_id: "idn_2",
        email_addresses: [
          { id: "idn_1", email_address: "old@example.com" },
          { id: "idn_2", email_address: "will@example.com" },
        ],
      })
    ).toBe("will@example.com");
  });

  it("falls back to the first address, and to null when there is none", () => {
    expect(
      primaryEmail({ email_addresses: [{ id: "idn_1", email_address: "only@example.com" }] })
    ).toBe("only@example.com");
    expect(primaryEmail({ id: "user_1" })).toBe(null);
  });
});
