import React from "react";
import { Link } from "react-router";
import { membershipPanel } from "@sendtally/features/billing";
import { MembershipPanel, panelButton, panelMono } from "./MembershipPanel";

/** The pitch on locked trend screens: same panel, its strip links to the membership page. */
export function UpgradePanel(): React.ReactElement {
  const panel = membershipPanel();
  return (
    <MembershipPanel eyebrow={panel.eyebrow} title={panel.title} body={panel.body}>
      <span style={{ ...panelMono, fontSize: 10 }}>{panel.footnote}</span>
      <Link to="/app/membership" style={panelButton}>
        {panel.cta} →
      </Link>
    </MembershipPanel>
  );
}
