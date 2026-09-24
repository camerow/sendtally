import React from "react";
import { membershipPanel } from "@sendtally/features/billing";
import { MembershipPanel, panelMono } from "../../billing/components/MembershipPanel";
import { useLanding } from "../../landing/LandingContext";
import { AccountCta } from "../../landing/components/AccountCta";

const column: React.CSSProperties = {
  flex: "1 1 240px",
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: 12,
};

function Offer({
  terms,
  children,
}: {
  terms: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div style={column}>
      {children}
      <span style={{ ...panelMono, fontSize: 10 }}>{terms}</span>
    </div>
  );
}

/** The in-app membership card, used as the default upsell at the end of every post. */
export function MembershipCta(): React.ReactElement {
  const panel = membershipPanel();
  const { signedIn } = useLanding();
  return (
    <aside className="b-membership">
      <MembershipPanel eyebrow={panel.eyebrow} title={panel.title} body={panel.body}>
        {!signedIn && (
          <Offer terms="No card · no trial">
            <AccountCta variant="ghostOnLight" label="Join now, free" />
          </Offer>
        )}
        <Offer terms="$2/mo billed yearly">
          <AccountCta variant="azure" label={panel.cta} />
        </Offer>
      </MembershipPanel>
    </aside>
  );
}
