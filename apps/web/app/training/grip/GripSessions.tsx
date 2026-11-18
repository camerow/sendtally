import React from "react";
import { Link } from "react-router";
import type { GripSessionVM } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { SectionHeading } from "../../components/detail/SectionHeading";
import { activityPath } from "../log/paths";
import { DayColumn } from "../../sessions/components/DayColumn";

/**
 * Every session on the grip, newest first, read like the log: its day, this grip's hangs with Best
 * on a best, the edge and time under tension, and the added weight rightmost.
 */
export function GripSessions({ rows }: { rows: readonly GripSessionVM[] }): React.ReactElement {
  return (
    <section className="detail-section">
      <SectionHeading
        title={t("hang.history", { count: t("hang.sessionCount", { count: rows.length }) })}
      />
      {rows.map((s, i) => (
        <Link
          key={`${s.id}:${i}`}
          to={activityPath(s.id)}
          className="log-row log-row--divided log-row--link grip-session"
          aria-label={[
            `${s.weekday} ${s.day}`,
            s.title,
            s.meta,
            s.load,
            ...(s.best ? [t("statistics.best")] : []),
          ].join(", ")}
        >
          <DayColumn weekday={s.weekday} day={s.day} />
          <span className="log-row-main">
            <span className="log-row-title">
              <span className="log-row-title-text">{s.title}</span>
              {s.best && <span className="best-badge">{t("statistics.best")}</span>}
            </span>
            {s.meta !== "" && <span className="log-row-meta">{s.meta}</span>}
          </span>
          <span className="grip-session-load">{s.load}</span>
        </Link>
      ))}
    </section>
  );
}
