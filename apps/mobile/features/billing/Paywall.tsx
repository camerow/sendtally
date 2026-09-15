import React from "react";
import type { Entitlements } from "@sendtally/api-client";
import { membershipPanel } from "@sendtally/features/billing";
import { MembershipPanel } from "./MembershipPanel";
import { PurchaseControls } from "./PurchaseControls";
import { useBilling } from "./useBilling";
import { usePurchase } from "./usePurchase";

function StorePaywall({ refresh }: { refresh: () => Promise<Entitlements> }): React.ReactElement {
  const purchase = usePurchase(refresh);
  const panel = membershipPanel();
  return (
    <MembershipPanel eyebrow={panel.eyebrow} title={panel.title} body={panel.body}>
      <PurchaseControls purchase={purchase} />
    </MembershipPanel>
  );
}

export function Paywall(): React.ReactElement {
  const billing = useBilling();
  const panel = membershipPanel();
  if (billing === null) {
    return <MembershipPanel eyebrow={panel.eyebrow} title={panel.title} body={panel.body} />;
  }
  return <StorePaywall refresh={billing.membership.refresh} />;
}
