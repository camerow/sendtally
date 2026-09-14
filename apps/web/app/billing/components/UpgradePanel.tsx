import React from "react";
import { Link } from "react-router";
import { membershipPanel } from "@sendtally/features/billing";
import { ledgerEyebrow, MembershipLedger } from "./MembershipLedger";

export const UPGRADE_PANEL_ID = "membership-panel";

export const goldPanel: React.CSSProperties = {
  background: "var(--surface-accent-gold)",
  borderRadius: "var(--radius-panel)",
  padding: "clamp(20px, 3vw, 28px)",
  display: "flex",
  flexDirection: "column",
  gap: 16,
  color: "var(--text-on-light)",
};

export const goldPanelTitle: React.CSSProperties = {
  margin: 0,
  fontFamily: "var(--font-display)",
  fontWeight: 800,
  fontSize: "clamp(26px, 3.4vw, 32px)",
  lineHeight: 1,
  letterSpacing: "-0.035em",
  textWrap: "balance",
};

export function UpgradePanel(): React.ReactElement {
  const panel = membershipPanel();
  return (
    <div id={UPGRADE_PANEL_ID} style={{ ...goldPanel, scrollMarginTop: 24 }}>
      <span style={ledgerEyebrow}>{panel.eyebrow}</span>
      <h2 style={goldPanelTitle}>{panel.title}</h2>
      <p
        style={{
          margin: 0,
          fontSize: 14,
          lineHeight: 1.55,
          color: "var(--text-on-light-secondary)",
          maxWidth: "52ch",
          textWrap: "pretty",
        }}
      >
        {panel.body}
      </p>
      <MembershipLedger />
      <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <Link
          to="/app/membership"
          style={{
            fontFamily: "var(--font-sans)",
            fontWeight: 600,
            fontSize: 15,
            color: "var(--bs-white)",
            background: "var(--bs-azure-ink)",
            borderRadius: "var(--radius-control)",
            padding: "13px 20px",
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
        >
          {panel.cta} →
        </Link>
        <span style={{ ...ledgerEyebrow, fontSize: 10, color: "rgba(64,63,76,0.75)" }}>
          {panel.footnote}
        </span>
      </div>
    </div>
  );
}
