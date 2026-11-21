import React from "react";
import type { MembershipFeature } from "@sendtally/features/billing";
import { MembershipView } from "../features/billing/MembershipView";
import { useBilling } from "../features/billing/useBilling";
import { usePurchase } from "../features/billing/usePurchase";
import { goBack } from "../lib/goBack";

function MembershipWithBilling({
  membership,
}: {
  membership: MembershipFeature;
}): React.ReactElement {
  const purchase = usePurchase(membership.refresh);
  return <MembershipView membership={membership} purchase={purchase} onBack={() => goBack()} />;
}

export default function MembershipScreen(): React.ReactElement | null {
  const billing = useBilling();
  if (billing === null) return null;
  return <MembershipWithBilling membership={billing.membership} />;
}
