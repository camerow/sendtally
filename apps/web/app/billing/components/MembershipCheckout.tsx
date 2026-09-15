import { CheckoutButton, usePlans } from "@clerk/react/experimental";
import React from "react";
import { useRevalidator } from "react-router";
import { colors, radius } from "@sendtally/design/tokens";
import { formatNumber, t } from "@sendtally/features/i18n";
import { Segmented } from "../../components/Segmented";
import { panelButton, panelMono } from "./MembershipPanel";

export const SUBSCRIBED_PARAM = "subscribed";
export const MEMBER_PLAN_SLUG = "member";

type Period = "annual" | "month";
type Plan = ReturnType<typeof usePlans>["data"][number];
type Money = NonNullable<Plan["fee"]>;

const appearance = {
  variables: {
    colorPrimary: colors.azureInk,
    colorBackground: colors.white,
    colorForeground: colors.gunmetal,
    borderRadius: `${radius.control}px`,
  },
} as const;

function money(amount: Money): string {
  return formatNumber(amount.amount / 100, {
    style: "currency",
    currency: amount.currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function Price({ plan, period }: { plan: Plan; period: Period }): React.ReactElement | null {
  const monthly =
    period === "annual" && plan.annualMonthlyFee !== null ? plan.annualMonthlyFee : plan.fee;
  if (monthly === null) return null;
  const suffix =
    period === "annual"
      ? t("billing.perMonthBilledYearly")
      : t("billing.perPeriod", { period: t("billing.period.month") });
  return (
    <span style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
      <b
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: 34,
          letterSpacing: "-0.03em",
          lineHeight: 1,
        }}
      >
        {money(monthly)}
      </b>
      <span style={{ ...panelMono, textTransform: "none" }}>
        {suffix} · {t("billing.cancelAnyTime")}
      </span>
    </span>
  );
}

/** The not-a-member strip: price, billing period, and Clerk's checkout behind our own button. */
export function MembershipCheckout(): React.ReactElement {
  const { data, isLoading } = usePlans({ for: "user" });
  const { revalidate } = useRevalidator();
  const [chosen, setPeriod] = React.useState<Period | null>(null);
  const plan = data.find((p) => p.slug === MEMBER_PLAN_SLUG) ?? null;
  const period = chosen ?? (plan?.annualFee === null ? "month" : "annual");

  if (plan === null) {
    return (
      <span style={panelMono}>
        {isLoading ? t("billing.loadingPlans") : t("billing.plansUnavailableWeb")}
      </span>
    );
  }

  const options = [
    ...(plan.annualFee === null
      ? []
      : [
          {
            value: "annual" as const,
            label: t("billing.yearlyPrice", { price: money(plan.annualFee) }),
          },
        ]),
    ...(plan.fee === null
      ? []
      : [
          { value: "month" as const, label: t("billing.monthlyPrice", { price: money(plan.fee) }) },
        ]),
  ];

  return (
    <>
      <span style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
        <Price plan={plan} period={period} />
        {options.length > 1 && (
          <Segmented
            label={t("billing.plans")}
            options={options}
            value={period}
            onChange={setPeriod}
          />
        )}
      </span>
      <CheckoutButton
        planId={plan.id}
        planPeriod={period}
        checkoutProps={{ appearance }}
        newSubscriptionRedirectUrl={`/app/membership?${SUBSCRIBED_PARAM}=1`}
        onSubscriptionComplete={() => void revalidate()}
      >
        <button type="button" style={panelButton}>
          {t("billing.becomeAMember")} →
        </button>
      </CheckoutButton>
    </>
  );
}
