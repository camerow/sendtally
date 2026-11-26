import { useLocalSearchParams } from "expo-router";
import React from "react";
import {
  membershipSource,
  useMembersGet,
  usePaywallShown,
  type MembershipFeature,
} from "@sendtally/features/billing";
import { useCapture } from "../features/analytics/useCapture";
import { MembershipView } from "../features/billing/MembershipView";
import { useBilling } from "../features/billing/useBilling";
import { usePurchase } from "../features/billing/usePurchase";
import { useApi } from "../lib/api";
import { goBack } from "../lib/goBack";

function MembershipWithBilling({
  membership,
}: {
  membership: MembershipFeature;
}): React.ReactElement {
  const purchase = usePurchase(membership.refresh);
  const members = useMembersGet(useApi());
  const source = membershipSource(useLocalSearchParams<{ source?: string }>().source);
  usePaywallShown(
    source,
    membership.state.status === "ready" && membership.active === false,
    useCapture()
  );
  return (
    <MembershipView
      membership={membership}
      members={members}
      purchase={purchase}
      fromSettings={source === null}
      onBack={() => goBack()}
    />
  );
}

export default function MembershipScreen(): React.ReactElement | null {
  const billing = useBilling();
  if (billing === null) return null;
  return <MembershipWithBilling membership={billing.membership} />;
}
