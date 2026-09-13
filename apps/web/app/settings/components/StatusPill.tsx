import React from "react";

export type StatusPillProps = {
  label: string;
  active: boolean;
};

export function StatusPill({ label, active }: StatusPillProps): React.ReactElement {
  return (
    <span
      style={{
        fontFamily: "var(--font-mono)",
        fontWeight: 500,
        fontSize: 9,
        letterSpacing: "0.07em",
        padding: "3px 8px",
        borderRadius: "var(--radius-pill)",
        border: `1px solid ${active ? "rgba(27,98,206,0.4)" : "var(--line-on-light-strong)"}`,
        color: active ? "var(--bs-azure-ink)" : "rgba(64,63,76,0.55)",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}
