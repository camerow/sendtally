import React from "react";

export type Stat = { label: string; value: string };

export type StatStripProps = { stats?: Stat[] };

export function StatStrip({ stats = [] }: StatStripProps): React.ReactElement {
  return (
    <div
      className="ds-statstrip"
      style={{ "--statstrip-cols": stats.length || 1 } as React.CSSProperties}
    >
      {stats.map((s) => (
        <div key={s.label} className="ds-statstrip-cell">
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontWeight: 500,
              fontSize: 10,
              letterSpacing: "var(--type-label-track)",
              textTransform: "uppercase",
              color: "var(--text-on-white-secondary)",
            }}
          >
            {s.label}
          </span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontWeight: 600,
              fontSize: 17,
              color: "var(--bs-gunmetal)",
            }}
          >
            {s.value}
          </span>
        </div>
      ))}
    </div>
  );
}
