import React from "react";
import type { Entitlements } from "@sendtally/api-client";
import { PurchaseControls } from "./PurchaseControls";
import { UpgradeCard, type UpgradeCardProps } from "./UpgradeCard";
import { useBilling } from "./useBilling";
import { usePurchase } from "./usePurchase";

export type PaywallProps = Omit<UpgradeCardProps, "children">;

function StorePaywall({
  refresh,
  ...card
}: PaywallProps & { refresh: () => Promise<Entitlements> }): React.ReactElement {
  const purchase = usePurchase(refresh);
  return (
    <UpgradeCard {...card}>
      <PurchaseControls purchase={purchase} />
    </UpgradeCard>
  );
}

export function Paywall(props: PaywallProps): React.ReactElement {
  const billing = useBilling();
  if (billing === null) return <UpgradeCard {...props} />;
  return <StorePaywall {...props} refresh={billing.membership.refresh} />;
}
