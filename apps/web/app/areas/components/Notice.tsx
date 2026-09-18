import React from "react";

export function Notice({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <div
      role="status"
      style={{
        marginTop: 20,
        padding: "14px 18px",
        borderRadius: "var(--radius-control)",
        background: "rgba(49,133,252,0.1)",
        color: "var(--bs-gunmetal)",
        fontSize: 14,
        lineHeight: 1.5,
      }}
    >
      {children}
    </div>
  );
}
