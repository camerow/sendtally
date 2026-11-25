import React from "react";
import type { Entitlements, SendtallyApi } from "@sendtally/api-client";
import { hasAccess, membershipVM, type MembershipFeature } from "@sendtally/features/billing";
import { BillingContext } from "./context";

export { ENTITLEMENTS } from "@sendtally/features/billing/testing";

export function billingFeature(entitlements: Entitlements): MembershipFeature {
  const vm = membershipVM(entitlements);
  return {
    state: { status: "ready", data: entitlements },
    vm,
    active: vm.active,
    access: hasAccess(entitlements),
    reload: () => Promise.resolve(),
    refresh: () => Promise.resolve(entitlements),
  };
}

export const apiWith = (entitlements: Entitlements): SendtallyApi =>
  new Proxy(
    {},
    {
      get: (_, key) =>
        key === "then"
          ? undefined
          : key === "entitlements"
            ? () => Promise.resolve(entitlements)
            : () => new Promise(() => {}),
    }
  ) as SendtallyApi;

export const withBilling = (
  ui: React.ReactElement,
  entitlements: Entitlements
): React.ReactElement => (
  <BillingContext.Provider value={{ membership: billingFeature(entitlements) }}>
    {ui}
  </BillingContext.Provider>
);
