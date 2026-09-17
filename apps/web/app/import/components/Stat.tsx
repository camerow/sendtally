import React from "react";
import { statLabel, statNumber } from "../styles";

export function Stat({
  value,
  label,
  accent = false,
}: {
  value: string | number;
  label: string;
  accent?: boolean;
}): React.ReactElement {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span style={{ ...statNumber, ...(accent ? { color: "var(--bs-watermelon-ink)" } : {}) }}>
        {value}
      </span>
      <span style={statLabel}>{label}</span>
    </div>
  );
}
