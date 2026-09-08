import React from "react";
import type { SessionRow } from "@sendtally/api-client";
import {
  sessionBadge,
  sessionTitle,
  sessionTotals,
  totalsLabel,
  type SessionTagGroup,
} from "@sendtally/features/sessions";
import { SessionRowItem } from "./SessionRowItem";

export function SessionTagSection({
  group,
}: {
  group: SessionTagGroup<SessionRow>;
}): React.ReactElement {
  return (
    <section>
      <h2 className="sessions-year sessions-tag-head">
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: 24,
            letterSpacing: "-0.03em",
            margin: 0,
          }}
        >
          {group.label}
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
          {totalsLabel(sessionTotals(group.sessions))}
        </span>
      </h2>
      <div className="sessions-rows sessions-tag-rows">
        {group.sessions.map((s) => (
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
