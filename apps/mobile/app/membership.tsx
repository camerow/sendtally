import { useLocalSearchParams } from "expo-router";
import React from "react";
import {
  membershipSource,
  useMembersGet,
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
  const capture = useCapture();
  const free = membership.state.status === "ready" && membership.active === false;
  const sent = React.useRef(false);
  React.useEffect(() => {
    if (source === null || !free || sent.current) return;
    sent.current = true;
    capture("paywall_shown", { source });
  }, [source, free, capture]);
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
