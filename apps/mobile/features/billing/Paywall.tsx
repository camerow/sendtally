import React from "react";
import type { Entitlements } from "@sendtally/api-client";
import { PurchaseControls } from "./PurchaseControls";
import { UpgradeCard } from "./UpgradeCard";
import { useBilling } from "./useBilling";
import { usePurchase } from "./usePurchase";

function StorePaywall({ refresh }: { refresh: () => Promise<Entitlements> }): React.ReactElement {
  const purchase = usePurchase(refresh);
  return (
    <UpgradeCard>
      <PurchaseControls purchase={purchase} />
    </UpgradeCard>
  );
}

export function Paywall(): React.ReactElement {
  const billing = useBilling();
  if (billing === null) return <UpgradeCard />;
  return <StorePaywall refresh={billing.membership.refresh} />;
}
