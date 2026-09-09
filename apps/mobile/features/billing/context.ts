import React from "react";
import type { MembershipFeature } from "@sendtally/features/billing";

export type BillingContextValue = {
  membership: MembershipFeature;
};

export const BillingContext = React.createContext<BillingContextValue | null>(null);
