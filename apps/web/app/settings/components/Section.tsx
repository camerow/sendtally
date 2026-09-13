import React from "react";

export function Section({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <div
      style={{
        background: "var(--surface-soft)",
        border: "1px solid var(--line-on-light-soft)",
        borderRadius: "var(--radius-card)",
        padding: 18,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {children}
    </div>
  );
}
