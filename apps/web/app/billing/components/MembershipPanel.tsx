import React from "react";

const panelEyebrow: React.CSSProperties = {
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

export type MembershipPanelProps = {
  eyebrow: string;
  title: string;
  /** The strip at the bottom: status and manage. */
  children: React.ReactNode;
};

/** A member's gold panel: how they are a member, and the strip that manages it. */
export function MembershipPanel({
  eyebrow,
  title,
  children,
}: MembershipPanelProps): React.ReactElement {
  return (
    <div
      style={{
        background: "var(--surface-accent-gold)",
        borderRadius: "var(--radius-panel)",
        padding: "clamp(20px, 3vw, 28px)",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        color: "var(--text-on-light)",
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
