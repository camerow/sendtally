import React from "react";
import {
  countLabel,
  sessionBadge,
  sessionTitle,
  type SessionMonth,
} from "@sendtally/features/sessions";
import { monthAnchorId } from "../anchors";
import { SessionRowItem } from "./SessionRowItem";

export function SessionMonthGroup({ month }: { month: SessionMonth }): React.ReactElement {
  return (
    <section>
      <h3 className="sessions-month" id={monthAnchorId(month.key)}>
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 18,
            letterSpacing: "-0.02em",
            margin: 0,
          }}
        >
          {month.label}
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
          {countLabel(month.sessions.length)}
        </span>
      </h3>
      <div className="sessions-rows">
        {month.sessions.map((s) => (
          <SessionRowItem
            key={s.fingerprint}
            session={s}
            title={sessionTitle(s)}
            badge={sessionBadge(s)}
          />
        ))}
      </div>
    </section>
  );
}
