import { PricingTable } from "@clerk/react-router";
import React from "react";
import { colors, radius } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";

export const SUBSCRIBED_PARAM = "subscribed";

export type MembershipPricingProps = {
  newSubscriptionRedirectUrl?: string;
};

const appearance = {
  variables: {
    colorPrimary: colors.azureInk,
    colorBackground: colors.white,
    colorForeground: colors.gunmetal,
    borderRadius: `${radius.control}px`,
  },
} as const;

export function MembershipPricing({
  // Clerk hosts the checkout, so the redirect it lands on is the only hook we
  // get for "they just subscribed".
  newSubscriptionRedirectUrl = `/app/membership?${SUBSCRIBED_PARAM}=1`,
}: MembershipPricingProps): React.ReactElement {
  return (
    <PricingTable
      appearance={appearance}
      checkoutProps={{ appearance }}
      highlightedPlan="member"
      newSubscriptionRedirectUrl={newSubscriptionRedirectUrl}
      fallback={
        <div
          style={{
            border: "1px solid var(--line-on-light-soft)",
            borderRadius: "var(--radius-card)",
            padding: 36,
            textAlign: "center",
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "rgba(64,63,76,0.55)",
          }}
        >
          {t("billing.loadingPlans")}
        </div>
      }
    />
  );
}
