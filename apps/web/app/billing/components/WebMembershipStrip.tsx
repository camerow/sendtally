import { SubscriptionDetailsButton, useSubscription } from "@clerk/react/experimental";
import React from "react";
import { useRevalidator } from "react-router";
import { colors, radius } from "@sendtally/design/tokens";
import { formatRenewalDate, planLabel } from "@sendtally/features/billing";
import { t } from "@sendtally/features/i18n";
import { MEMBER_PLAN_SLUG } from "./MembershipCheckout";
import { panelGhostButton, panelMono } from "./MembershipPanel";

const appearance = {
  variables: {
    colorPrimary: colors.azureInk,
    colorBackground: colors.white,
    colorForeground: colors.gunmetal,
    borderRadius: `${radius.control}px`,
  },
} as const;

type SubscriptionItem = NonNullable<
  ReturnType<typeof useSubscription>["data"]
>["subscriptionItems"][number];

export type WebMembershipStatus = {
  /** Set when the membership will not renew: the page title names the day it ends. */
  endsOn: string | null;
  line: string;
};

export function webMembershipStatus(item: SubscriptionItem | null): WebMembershipStatus {
  if (item === null || item.periodEnd === null)
    return { endsOn: null, line: t("billing.memberWeb") };
  const date = formatRenewalDate(item.periodEnd.toISOString());
  if (item.canceledAt !== null) return { endsOn: date, line: t("billing.cancelledEnds", { date }) };
  if (item.isFreeTrial) return { endsOn: null, line: t("billing.freeTrialEnds", { date }) };
  const plan = planLabel(item.planPeriod === "annual" ? "yearly" : "monthly");
  return { endsOn: null, line: `${plan} · ${t("billing.renews", { date })}` };
}

export function useWebMembershipItem(): SubscriptionItem | null {
  const { data } = useSubscription({ for: "user" });
  return (
    data?.subscriptionItems.find(
      (i) => i.plan.slug === MEMBER_PLAN_SLUG && i.status === "active"
    ) ?? null
  );
}

/** The web-member strip: what the membership is doing next, and Clerk's manage drawer. */
export function WebMembershipStrip({
  status,
}: {
  status: WebMembershipStatus;
}): React.ReactElement {
  const { revalidate } = useRevalidator();
  return (
    <>
      <span style={panelMono}>{status.line}</span>
      <SubscriptionDetailsButton
        subscriptionDetailsProps={{ appearance }}
        onSubscriptionCancel={() => void revalidate()}
      >
        <button type="button" style={panelGhostButton}>
          {t("billing.manageMembership")}
        </button>
      </SubscriptionDetailsButton>
    </>
  );
}
