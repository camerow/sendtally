import type React from "react";

export const monoLabel: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontWeight: 500,
  fontSize: 11,
  letterSpacing: "0.08em",
  color: "rgba(64,63,76,0.72)",
};

export const columnHead: React.CSSProperties = {
  ...monoLabel,
  fontSize: 10,
  color: "rgba(64,63,76,0.55)",
};

export const inputStyle: React.CSSProperties = {
  fontFamily: "var(--font-sans)",
  fontSize: 15,
  color: "var(--bs-gunmetal)",
  background: "var(--bs-white)",
  border: "1px solid rgba(64,63,76,0.15)",
  borderRadius: "var(--radius-control)",
  padding: "12px 14px",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

export const chipStyle = (active: boolean): React.CSSProperties => ({
  fontFamily: "var(--font-mono)",
  fontWeight: 500,
  fontSize: 11,
  letterSpacing: "0.06em",
  padding: "10px 16px",
  borderRadius: "var(--radius-pill)",
  cursor: "pointer",
  background: active ? "var(--bs-gold)" : "transparent",
  color: active ? "var(--bs-gunmetal)" : "rgba(64,63,76,0.65)",
  border: active ? "1px solid var(--bs-gold)" : "1px solid rgba(64,63,76,0.18)",
});

export const stepperButton: React.CSSProperties = {
  borderRadius: 8,
  border: "1px solid rgba(64,63,76,0.18)",
  background: "none",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  color: "var(--bs-gunmetal)",
};

export const PLUS = "M8 3.6V12.4M3.6 8H12.4";
export const MINUS = "M3.6 8H12.4";
export const CROSS = "M4.2 4.2 11.8 11.8M11.8 4.2 4.2 11.8";
export const CHECK = "M3 8.4 6.2 11.6 12.6 4.8";
export const FLAG = "M4 14V2.8h7.6L9.4 6l2.2 3.2H4";
export const CHEVRON = "M6 4l4 4-4 4";
