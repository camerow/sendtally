import React from "react";
import { monthShortName, type SessionYear } from "@sendtally/features/sessions";
import { t, upper } from "@sendtally/features/i18n";
import { sectionAnchorId, yearAnchorId } from "../anchors";

const railLabel: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontWeight: 500,
  fontSize: 10,
  letterSpacing: "0.08em",
  color: "rgba(64,63,76,0.45)",
};

export function MonthJumpRail({
  years,
  currentKey,
}: {
  years: SessionYear[];
  currentKey: string | null;
}): React.ReactElement {
  return (
    <nav className="sessions-rail" aria-label={t("web.sessions.jumpToMonth")}>
      <span style={{ ...railLabel, padding: "0 0 4px" }}>{upper(t("web.sessions.jumpTo"))}</span>
      {years.map((year) => (
        <React.Fragment key={year.year}>
          <a
            href={`#${yearAnchorId(year.year)}`}
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              gap: 8,
              padding: "16px 0 6px",
              borderBottom: "1px solid var(--line-on-light)",
              marginBottom: 4,
              textDecoration: "none",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontWeight: 600,
                fontSize: 12,
                letterSpacing: "0.06em",
                color: "var(--bs-gunmetal)",
              }}
            >
              {year.label}
            </span>
            <span style={railLabel}>{year.totals.count}</span>
          </a>
          {year.months.map((month) => {
            const active = month.key === currentKey;
            return (
              <a
                key={month.key}
                href={`#${sectionAnchorId(month.key)}`}
                aria-current={active ? "true" : undefined}
                style={{
                  display: "block",
                  padding: "7px 0 7px 12px",
                  borderLeft: `3px solid ${active ? "var(--bs-gold)" : "transparent"}`,
                  textDecoration: "none",
                  fontFamily: "var(--font-mono)",
                  fontWeight: active ? 600 : 500,
                  fontSize: 11,
                  letterSpacing: "0.06em",
                  color: active ? "var(--bs-gunmetal)" : "rgba(64,63,76,0.55)",
                }}
              >
                {monthShortName(month.month)}
              </a>
            );
          })}
        </React.Fragment>
      ))}
    </nav>
  );
}
