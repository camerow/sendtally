import React from "react";
import {
  countLabel,
  sessionBadge,
  sessionTitle,
  type SessionMonth,
} from "@sendtally/features/sessions";
import { SectionHeading } from "./SectionHeading";
import { SessionRowItem } from "./SessionRowItem";

export function SessionMonthGroup({ month }: { month: SessionMonth }): React.ReactElement {
  return (
    <section>
      <SectionHeading
        sectionKey={month.key}
        title={month.name}
        year={month.year}
        meta={countLabel(month.sessions.length)}
      />
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
