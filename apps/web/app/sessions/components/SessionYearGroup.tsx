import React from "react";
import { totalsLabel, type SessionYear } from "@sendtally/features/sessions";
import { yearAnchorId } from "../anchors";
import { SessionMonthGroup } from "./SessionMonthGroup";

export function SessionYearGroup({ year }: { year: SessionYear }): React.ReactElement {
  return (
    <section>
      <h2 className="sessions-year" id={yearAnchorId(year.year)}>
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: 24,
            letterSpacing: "-0.03em",
            margin: 0,
          }}
        >
          {year.label}
        </span>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontWeight: 500,
            fontSize: 10,
            letterSpacing: "0.08em",
            color: "rgba(64,63,76,0.55)",
          }}
        >
          {totalsLabel(year.totals)}
        </span>
      </h2>
      {year.months.map((month) => (
        <SessionMonthGroup key={month.key} month={month} />
      ))}
    </section>
  );
}
