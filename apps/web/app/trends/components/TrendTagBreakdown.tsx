import React from "react";
import type { TrendTagRowVM } from "@sendtally/features/trends";
import { t } from "@sendtally/features/i18n";
import { CircuitDot } from "../../components/CircuitDot";

const label: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  textTransform: "uppercase",
  fontWeight: 500,
  fontSize: 10,
  letterSpacing: "0.08em",
  color: "var(--text-label-accent)",
};

export type TrendTagBreakdownProps = {
  title: string;
  rows: TrendTagRowVM[];
  compact?: boolean;
};

export function TrendTagBreakdown({
  title,
  rows,
  compact = false,
}: TrendTagBreakdownProps): React.ReactElement | null {
  if (rows.length === 0) return null;
  const barHeight = compact ? 8 : 12;
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: compact ? 7 : 12 }}>
      <span style={{ ...label, ...(compact ? { color: "rgba(64,63,76,0.55)" } : {}) }}>
        {title}
      </span>
      <div style={{ display: "flex", flexDirection: "column", gap: compact ? 6 : 9 }}>
        {rows.map((row) => (
          <div
            key={row.key}
            style={{
              display: "grid",
              gridTemplateColumns: compact
                ? "minmax(72px, 118px) 1fr 40px"
                : "minmax(96px, 150px) 1fr 56px",
              gap: compact ? 10 : 14,
              alignItems: "center",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
              {row.colour !== undefined && (
                <CircuitDot colour={row.colour} size={compact ? 10 : 12} />
              )}
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: compact ? 10 : 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: compact ? "rgba(64,63,76,0.72)" : "var(--bs-gunmetal)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={t("trends.tagRowTitle", { label: row.label, count: row.sessions })}
              >
                {row.label}
              </span>
            </span>
            <span
              style={{
                height: barHeight,
                borderRadius: 3,
                background: "var(--data-bar-empty)",
                overflow: "hidden",
              }}
            >
              <span
                style={{
                  display: "block",
                  height: "100%",
                  width: `${Math.max(row.ratio * 100, 2)}%`,
                  background: "var(--data-bar)",
                  borderRadius: 3,
                }}
              />
            </span>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontWeight: 600,
                fontSize: compact ? 11 : 12,
                textAlign: "right",
                color: "var(--bs-gunmetal)",
              }}
            >
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
