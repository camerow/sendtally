import React from "react";
import type { Capture } from "../onboarding/types";
import type { MembershipSource } from "./types";

export function usePaywallShown(
  source: MembershipSource | null,
  free: boolean,
  capture: Capture
): void {
  const sent = React.useRef(false);
  React.useEffect(() => {
    if (source === null || !free || sent.current) return;
    sent.current = true;
    capture("paywall_shown", { source });
  }, [source, free, capture]);
}
