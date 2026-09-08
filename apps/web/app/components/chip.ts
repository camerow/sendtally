import type React from "react";

export function chipStyle(
  active: boolean,
  overrides: React.CSSProperties = {}
): React.CSSProperties {
  return {
    fontFamily: "var(--font-mono)",
    fontWeight: 500,
    fontSize: 11,
    letterSpacing: "0.06em",
    padding: "7px 12px",
    borderRadius: "var(--radius-pill)",
    cursor: "pointer",
    textDecoration: "none",
    whiteSpace: "nowrap",
    background: active ? "var(--bs-gold)" : "transparent",
    color: active ? "var(--bs-gunmetal)" : "rgba(64,63,76,0.65)",
    border: active ? "1px solid var(--bs-gold)" : "1px solid rgba(64,63,76,0.18)",
    ...overrides,
  };
}
