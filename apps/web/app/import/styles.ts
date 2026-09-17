import type React from "react";

export const stepRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontFamily: "var(--font-mono)",
  fontSize: 10,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "rgba(64,63,76,0.45)",
};

export const stepOn: React.CSSProperties = { color: "var(--bs-gunmetal)", fontWeight: 600 };

export const stepDot: React.CSSProperties = {
  width: 4,
  height: 4,
  borderRadius: 2,
  background: "rgba(64,63,76,0.25)",
};

export const code: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 11,
  lineHeight: 1.6,
  background: "var(--bs-white)",
  border: "1px solid var(--line-on-light)",
  borderRadius: "var(--radius-control)",
  padding: "12px 14px",
  color: "var(--bs-gunmetal)",
  whiteSpace: "pre",
  overflowX: "auto",
  margin: 0,
};

export const th: React.CSSProperties = {
  textAlign: "left",
  fontFamily: "var(--font-mono)",
  fontWeight: 500,
  fontSize: 10,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "rgba(64,63,76,0.55)",
  padding: "6px 8px",
  borderBottom: "1px solid var(--line-on-light)",
};

export const td: React.CSSProperties = {
  fontSize: 13,
  padding: 8,
  borderBottom: "1px solid var(--line-on-light-soft)",
  verticalAlign: "top",
};

export const tdMono: React.CSSProperties = {
  ...td,
  fontFamily: "var(--font-mono)",
  fontSize: 11,
  whiteSpace: "nowrap",
};

export const statNumber: React.CSSProperties = {
  fontFamily: "var(--font-display)",
  fontWeight: 700,
  fontSize: 26,
  letterSpacing: "-0.02em",
  lineHeight: 1,
};

export const statLabel: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontWeight: 500,
  fontSize: 10,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "rgba(64,63,76,0.55)",
};

export const pill: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontWeight: 500,
  fontSize: 10,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  borderRadius: "var(--radius-pill)",
  padding: "4px 10px",
  whiteSpace: "nowrap",
};

export const pillOk: React.CSSProperties = {
  ...pill,
  background: "rgba(49,133,252,0.12)",
  color: "var(--bs-azure-ink)",
};

export const pillMuted: React.CSSProperties = {
  ...pill,
  background: "rgba(64,63,76,0.08)",
  color: "var(--text-on-white-secondary)",
};

export const goldButton: React.CSSProperties = {
  fontFamily: "var(--font-sans)",
  fontWeight: 600,
  fontSize: 15,
  color: "var(--bs-gunmetal)",
  background: "var(--bs-gold)",
  border: "1px solid transparent",
  borderRadius: "var(--radius-control)",
  padding: "14px 22px",
  cursor: "pointer",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
};
