import React from "react";
import { BillingContext, type BillingContextValue } from "./context";

export function useBilling(): BillingContextValue | null {
  return React.useContext(BillingContext);
}
