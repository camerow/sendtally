import React from "react";
import type { Entitlements } from "@sendtally/api-client";
import { membershipPanel } from "@sendtally/features/billing";
import { MembershipPanel, type LedgerRowVM } from "./MembershipPanel";
import { PurchaseControls } from "./PurchaseControls";
import { useBilling } from "./useBilling";
import { usePurchase } from "./usePurchase";

/** The panel's words in place of the stats pitch, as the wizard's membership moment uses. */
export type PaywallCopy = {
  eyebrow?: string;
  title?: string;
  body?: string;
  rows?: readonly LedgerRowVM[];
};

function StorePaywall({
  refresh,
  copy,
}: {
  refresh: () => Promise<Entitlements>;
  copy: Required<Omit<PaywallCopy, "rows">> & Pick<PaywallCopy, "rows">;
}): React.ReactElement {
  const purchase = usePurchase(refresh);
  return (
    <MembershipPanel {...copy}>
      <PurchaseControls purchase={purchase} />
    </MembershipPanel>
  );
}

export function Paywall({ eyebrow, title, body, rows }: PaywallCopy = {}): React.ReactElement {
  const billing = useBilling();
  const panel = membershipPanel();
  const copy = {
    eyebrow: eyebrow ?? panel.eyebrow,
    title: title ?? panel.title,
    body: body ?? panel.body,
    ...(rows === undefined ? {} : { rows }),
  };
  if (billing === null) return <MembershipPanel {...copy} />;
  return <StorePaywall refresh={billing.membership.refresh} copy={copy} />;
}
