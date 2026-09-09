import React from "react";
import { BillingContext, type BillingContextValue } from "./context";

export function useBilling(): BillingContextValue | null {
  return React.useContext(BillingContext);
}

export function useCanSeeInsights(): boolean | null {
  const billing = useBilling();
  if (billing === null) return false;
  return billing.membership.active;
}
