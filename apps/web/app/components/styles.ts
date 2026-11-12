import type React from "react";

/** The small uppercase mono label over a field or a list. */
export const monoLabel: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontWeight: 500,
  fontSize: 11,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "rgba(64,63,76,0.72)",
};

export const monoMuted: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  textTransform: "uppercase",
  fontWeight: 500,
  fontSize: 11,
  letterSpacing: "0.06em",
  color: "rgba(64,63,76,0.55)",
};

/** A section's heading in the label accent. */
export const sectionLabel: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontWeight: 500,
  fontSize: 10,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--text-label-accent)",
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
