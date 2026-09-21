import type React from "react";

export const inputStyle: React.CSSProperties = {
  fontFamily: "var(--font-sans)",
  fontSize: 15,
  color: "var(--bs-gunmetal)",
  background: "var(--bs-white)",
  border: "1px solid rgba(64,63,76,0.15)",
  borderRadius: "var(--radius-control)",
  padding: "13px 16px",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

export const monoMuted: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  textTransform: "uppercase",
  fontWeight: 500,
  fontSize: 11,
  letterSpacing: "0.06em",
  color: "rgba(64,63,76,0.55)",
};
