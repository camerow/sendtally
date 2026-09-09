import React from "react";
import type { SessionRow } from "@sendtally/api-client";
import {
  sessionBadge,
  sessionTitle,
  sessionTotals,
  totalsLabel,
  type SessionTagGroup,
} from "@sendtally/features/sessions";
import { SectionHeading } from "./SectionHeading";
import { SessionRowItem } from "./SessionRowItem";

export function SessionTagSection({
  group,
}: {
  group: SessionTagGroup<SessionRow>;
}): React.ReactElement {
  return (
    <section>
      <SectionHeading
        sectionKey={group.key}
        title={group.label}
        year={null}
        meta={totalsLabel(sessionTotals(group.sessions))}
        top
      />
      <div className="sessions-rows">
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
