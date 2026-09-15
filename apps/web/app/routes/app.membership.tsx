import React from "react";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, useSearchParams } from "react-router";
import type { Membership } from "@sendtally/api-client";
import { Badge } from "@sendtally/design";
import { membershipPanel, membershipVM, storeChipName } from "@sendtally/features/billing";
import { t } from "@sendtally/features/i18n";
import { MembershipCheckout, SUBSCRIBED_PARAM } from "../billing/components/MembershipCheckout";
import { MembershipPanel } from "../billing/components/MembershipPanel";
import { StoreMembershipStrip } from "../billing/components/StoreMembershipStrip";
import {
  useWebMembershipItem,
  WebMembershipStrip,
  webMembershipStatus,
} from "../billing/components/WebMembershipStrip";
import { capture } from "../lib/analytics";
import { getMembership } from "../lib/billing.server";

type LoaderData = { membership: Membership };

/** Fires once for the checkout redirect, then drops the marker so a reload cannot double count. */
function useSubscribedRedirect(): void {
  const [params, setParams] = useSearchParams();
  const marked = params.get(SUBSCRIBED_PARAM) !== null;

  React.useEffect(() => {
    if (!marked) return;
    capture("membership_started", { channel: "web" });
    setParams(
      (next) => {
        next.delete(SUBSCRIBED_PARAM);
        return next;
      },
      { replace: true }
    );
  }, [marked, setParams]);
}

export async function loader(args: LoaderFunctionArgs): Promise<LoaderData> {
  return { membership: await getMembership(args) };
}

function WebMemberPanel(): React.ReactElement {
  const status = webMembershipStatus(useWebMembershipItem());
  return (
    <MembershipPanel
      eyebrow={t("billing.memberVia", { store: "sendtally.com" })}
      title={
        status.endsOn === null
          ? t("billing.trendsOpen")
          : t("billing.trendsOpenUntil", { date: status.endsOn })
      }
      linkRows
    >
      <WebMembershipStrip status={status} />
    </MembershipPanel>
  );
}

export default function MembershipRoute(): React.ReactElement {
  const { membership } = useLoaderData<typeof loader>();
  useSubscribedRedirect();
  const vm = membershipVM({ membership });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <h1
          style={{
            margin: 0,
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 32,
            letterSpacing: "-0.03em",
          }}
        >
          {t("common.membership")}
        </h1>
        {vm.active && <Badge tone="petal">{t("common.member")}</Badge>}
      </div>

      {!vm.active ? (
        <MembershipPanel eyebrow={membershipPanel().eyebrow} title={membershipPanel().pageTitle}>
          <MembershipCheckout />
        </MembershipPanel>
      ) : vm.managedIn === "web" ? (
        <WebMemberPanel />
      ) : (
        <MembershipPanel
          eyebrow={t("billing.memberVia", { store: storeChipName(vm.managedIn ?? "other") })}
          title={t("billing.trendsOpen")}
          linkRows
        >
          <StoreMembershipStrip vm={vm} />
        </MembershipPanel>
      )}
    </div>
  );
}
