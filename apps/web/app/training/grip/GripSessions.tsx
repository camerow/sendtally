import React from "react";
import { Link } from "react-router";
import type { GripSessionVM } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { SectionHeading } from "../../components/detail/SectionHeading";
import { activityPath } from "../log/paths";

/** Every session on the grip, newest first: load, day and setup, completion, Best on a best. */
export function GripSessions({ rows }: { rows: readonly GripSessionVM[] }): React.ReactElement {
  return (
    <section className="detail-section">
      <SectionHeading
        title={t("hang.history", { count: t("hang.sessionCount", { count: rows.length }) })}
      />
      {rows.map((s) => (
        <Link
          key={s.id}
          to={activityPath(s.id)}
          className="grip-session"
          aria-label={[
            s.load,
            s.meta,
            s.completion,
            ...(s.best ? [t("statistics.best")] : []),
          ].join(", ")}
        >
          <span className="grip-session-main">
            <span className="grip-session-load">
              {s.load}
              {s.best && <span className="best-badge">{t("statistics.best")}</span>}
            </span>
            <span className="grip-session-meta">{s.meta}</span>
          </span>
          <span className="grip-session-pct">{s.completion}</span>
        </Link>
      ))}
    </section>
  );
}
