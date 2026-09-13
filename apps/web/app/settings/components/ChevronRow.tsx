import React from "react";
import { Icon } from "../../components/Icon";

export function ChevronRow({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        minHeight: 44,
      }}
    >
      {children}
      <span style={{ display: "flex", color: "rgba(64,63,76,0.45)" }}>
        <Icon name="chevron" size={16} />
      </span>
    </div>
  );
}
