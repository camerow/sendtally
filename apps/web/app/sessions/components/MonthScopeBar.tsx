import React from "react";
import { MONTH_SHORT_NAMES, type SessionYear } from "@sendtally/features/sessions";
import { monthAnchorId, yearAnchorId } from "../anchors";

const chipBase: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontWeight: 500,
  fontSize: 11,
  letterSpacing: "0.06em",
  padding: "9px 13px",
  borderRadius: "var(--radius-pill)",
  textDecoration: "none",
  whiteSpace: "nowrap",
  flex: "none",
};

export function MonthScopeBar({
  years,
  currentKey,
}: {
  years: SessionYear[];
  currentKey: string | null;
}): React.ReactElement {
  return (
    <nav className="sessions-scope" aria-label="Jump to month">
      {years.map((year) => (
        <React.Fragment key={year.year}>
          <a
            href={`#${yearAnchorId(year.year)}`}
            style={{
              ...chipBase,
              fontWeight: 600,
              padding: "9px 12px",
              color: "var(--bs-gunmetal)",
              background: "var(--bs-white)",
              border: "1px solid var(--bs-gunmetal)",
            }}
          >
            {year.label}
          </a>
          {year.months.map((month) => {
            const active = month.key === currentKey;
            return (
              <a
                key={month.key}
                href={`#${monthAnchorId(month.key)}`}
                aria-current={active ? "true" : undefined}
                style={{
                  ...chipBase,
                  background: active ? "var(--bs-gold)" : "transparent",
                  color: active ? "var(--bs-gunmetal)" : "rgba(64,63,76,0.65)",
                  border: `1px solid ${active ? "var(--bs-gold)" : "rgba(64,63,76,0.18)"}`,
                }}
              >
                {MONTH_SHORT_NAMES[month.month - 1]}
              </a>
            );
          })}
        </React.Fragment>
      ))}
    </nav>
  );
}
