import React from "react";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, useSearchParams } from "react-router";
import type { Membership } from "@sendtally/api-client";
import { Badge } from "@sendtally/design";
import { MEMBERSHIP_PANEL, membershipVM } from "@sendtally/features/billing";
import { ledgerEyebrow, MembershipLedger } from "../billing/components/MembershipLedger";
import { MembershipPricing, SUBSCRIBED_PARAM } from "../billing/components/MembershipPricing";
import { goldPanel, goldPanelTitle } from "../billing/components/UpgradePanel";
import { StoreMembershipPanel } from "../billing/components/StoreMembershipPanel";
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

export default function MembershipRoute(): React.ReactElement {
  const { membership } = useLoaderData<typeof loader>();
  useSubscribedRedirect();
  const isMember = membership.active;
  // A store subscription has no web checkout to show; Clerk's table only
  // knows about web plans, so it stays for web members and non-members.
  const storeOnly = membership.store !== null && !membership.web;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
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
            Membership
          </h1>
          {isMember && <Badge tone="petal">MEMBER</Badge>}
        </div>
        <p
          style={{
            margin: 0,
            fontSize: 15,
            lineHeight: 1.55,
            color: "var(--text-on-white-secondary)",
            maxWidth: 620,
            textWrap: "pretty",
          }}
        >
          Logging sessions and posting them to Strava are free and always will be. Membership is
          what turns the log into a training history, and it is what pays for the server.
        </p>
      </div>

      {!isMember && (
        <div style={goldPanel}>
          <span style={ledgerEyebrow}>{MEMBERSHIP_PANEL.eyebrow}</span>
          <h2 style={goldPanelTitle}>{MEMBERSHIP_PANEL.pageTitle}</h2>
          <MembershipLedger />
        </div>
      )}

      {storeOnly ? (
        <StoreMembershipPanel vm={membershipVM({ membership })} />
      ) : (
        <div
          style={{
            background: "var(--bs-white)",
            border: "1px solid var(--line-on-light)",
            borderRadius: "var(--radius-panel)",
            padding: "clamp(20px, 4vw, 40px)",
          }}
        >
          <MembershipPricing />
        </div>
      )}
    </div>
  );
}
