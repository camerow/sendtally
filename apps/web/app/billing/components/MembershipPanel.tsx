import React from "react";
import { Link } from "react-router";
import { membershipPanel, type MembershipPanelRow } from "@sendtally/features/billing";
import { t } from "@sendtally/features/i18n";

export const MEMBERSHIP_PANEL_ID = "membership-panel";

export const panelEyebrow: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontWeight: 500,
  fontSize: 11,
  letterSpacing: "var(--type-label-track)",
  textTransform: "uppercase",
  color: "var(--text-on-light)",
};

export const panelMono: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 12,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "var(--text-on-light-secondary)",
};

export const panelButton: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontFamily: "var(--font-sans)",
  fontWeight: 600,
  fontSize: 15,
  color: "var(--bs-white)",
  background: "var(--bs-azure-ink)",
  border: "1px solid transparent",
  borderRadius: "var(--radius-control)",
  padding: "13px 22px",
  textDecoration: "none",
  whiteSpace: "nowrap",
  cursor: "pointer",
};

export const panelGhostButton: React.CSSProperties = {
  ...panelButton,
  color: "var(--bs-gunmetal)",
  background: "transparent",
  borderColor: "rgba(64,63,76,0.3)",
};

function LedgerRow({ row, link }: { row: MembershipPanelRow; link: boolean }): React.ReactElement {
  const bars = (
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
  );
  const text = (
    <span style={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <span style={{ ...panelEyebrow, fontSize: 9 }}>{row.eyebrow}</span>
      <span style={{ fontSize: 13, lineHeight: 1.45 }}>{row.line}</span>
    </span>
  );
  const style: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: link ? "44px 1fr auto" : "44px 1fr",
    gap: 12,
    alignItems: "center",
    padding: "9px 0",
    borderTop: "1px solid rgba(64,63,76,0.14)",
    color: "inherit",
    textDecoration: "none",
  };
  if (!link) {
    return (
      <div style={style}>
        {bars}
        {text}
      </div>
    );
  }
  return (
    <Link to={`/app/trends/${row.metric}`} style={style}>
      {bars}
      {text}
      <span style={{ ...panelEyebrow, fontSize: 11 }}>{t("billing.openTrend")} →</span>
    </Link>
  );
}

export type MembershipPanelProps = {
  eyebrow: string;
  title: string;
  body?: string;
  /** Members get the ledger rows as links into the trends they unlock. */
  linkRows?: boolean;
  /** The action strip at the bottom: price and checkout, or status and manage. */
  children: React.ReactNode;
};

/** The one gold surface every membership state shares; only the strip changes. */
export function MembershipPanel({
  eyebrow,
  title,
  body,
  linkRows = false,
  children,
}: MembershipPanelProps): React.ReactElement {
  return (
    <div
      id={MEMBERSHIP_PANEL_ID}
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
      <span style={panelEyebrow}>{eyebrow}</span>
      <h2
        style={{
          margin: 0,
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: "clamp(26px, 3.4vw, 32px)",
          lineHeight: 1.05,
          letterSpacing: "-0.035em",
          textWrap: "balance",
        }}
      >
        {title}
      </h2>
      {body !== undefined && (
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
          {body}
        </p>
      )}
      <div className="upgrade-ledger">
        {membershipPanel().rows.map((row) => (
          <LedgerRow key={row.metric} row={row} link={linkRows} />
        ))}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 20,
          flexWrap: "wrap",
          paddingTop: 18,
          borderTop: "1px solid rgba(64,63,76,0.22)",
        }}
      >
        {children}
      </div>
    </div>
  );
}
