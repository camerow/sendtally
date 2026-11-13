import React from "react";
import type { GripSessionVM } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { SectionHeading } from "../../components/detail/SectionHeading";

// ponytail: rows open nothing until the activity pages land (#278).
/** Every session on the grip, newest first: load, day and setup, completion, Best on a best. */
export function GripSessions({ rows }: { rows: readonly GripSessionVM[] }): React.ReactElement {
  return (
    <section className="detail-section">
      <SectionHeading
        title={t("hang.history", { count: t("hang.sessionCount", { count: rows.length }) })}
      />
      {rows.map((s) => (
        <div key={s.id} className="grip-session">
          <span className="grip-session-main">
            <span className="grip-session-load">
              {s.load}
              {s.best && <span className="best-badge">{t("statistics.best")}</span>}
            </span>
            <span className="grip-session-meta">{s.meta}</span>
          </span>
          <span className="grip-session-pct">{s.completion}</span>
        </div>
      ))}
    </section>
  );
}
