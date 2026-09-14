import React from "react";
import { Link } from "react-router";
import { MEMBERSHIP_PANEL, type MembershipPanelRow } from "@sendtally/features/billing";

export const UPGRADE_PANEL_ID = "membership-panel";

const eyebrow: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontWeight: 500,
  fontSize: 11,
  letterSpacing: "var(--type-label-track)",
  color: "var(--text-on-light)",
};

function LedgerRow({ row }: { row: MembershipPanelRow }): React.ReactElement {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "44px 1fr",
        gap: 12,
        alignItems: "center",
        padding: "8px 0",
        borderTop: "1px solid rgba(64,63,76,0.14)",
      }}
    >
      <span style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 24 }}>
        {row.bars.map((value, i) => (
          <i
            key={i}
            style={{
              flex: 1,
              display: "block",
              height: `${value}%`,
              borderRadius: "2px 2px 0 0",
              background: i === row.peak ? "var(--data-bar-peak)" : "var(--bs-gunmetal)",
              opacity: i === row.peak ? 1 : 0.85,
            }}
          />
        ))}
      </span>
      <span style={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <span style={{ ...eyebrow, fontSize: 9 }}>{row.eyebrow}</span>
        <span style={{ fontSize: 13, lineHeight: 1.45 }}>{row.line}</span>
      </span>
    </div>
  );
}

export function UpgradePanel(): React.ReactElement {
  return (
    <div
      id={UPGRADE_PANEL_ID}
      style={{
        background: "var(--surface-accent-gold)",
        borderRadius: "var(--radius-panel)",
        padding: "clamp(20px, 3vw, 28px)",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        color: "var(--text-on-light)",
        scrollMarginTop: 24,
      }}
    >
      <span style={eyebrow}>{MEMBERSHIP_PANEL.eyebrow}</span>
      <h2
        style={{
          margin: 0,
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: "clamp(26px, 3.4vw, 32px)",
          lineHeight: 1,
          letterSpacing: "-0.035em",
          textWrap: "balance",
        }}
      >
        {MEMBERSHIP_PANEL.title}
      </h2>
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
        {MEMBERSHIP_PANEL.body}
      </p>
      <div className="upgrade-ledger">
        {MEMBERSHIP_PANEL.rows.map((row) => (
          <LedgerRow key={row.eyebrow} row={row} />
        ))}
      </div>
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
          {MEMBERSHIP_PANEL.cta} →
        </Link>
        <span style={{ ...eyebrow, fontSize: 10, color: "rgba(64,63,76,0.75)" }}>
          {MEMBERSHIP_PANEL.footnote}
        </span>
      </div>
    </div>
  );
}
