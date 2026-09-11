import React from "react";
import { Link } from "react-router";
import type { SessionRow } from "@sendtally/api-client";
import { sessionDay, sessionGradeLabels, sessionMetaLabel } from "@sendtally/features/sessions";

export function SessionRowItem({
  session,
  title,
}: {
  session: SessionRow;
  title: string;
}): React.ReactElement {
  const { weekday, day } = sessionDay(session);
  const month = new Date(session.start_at).toLocaleDateString("en-US", {
    month: "short",
    timeZone: "UTC",
  });
  const onStrava = session.strava_activity_id !== null;
  return (
    <Link
      to={`/app/sessions/${encodeURIComponent(session.fingerprint)}`}
      className="session-row"
      aria-label={[
        title,
        `${weekday} ${month} ${day}`,
        sessionMetaLabel(session),
        onStrava ? "posted to Strava" : null,
      ]
        .filter((part) => part !== null)
        .join(", ")}
    >
      <span className="session-row-date">
        <span className="session-row-weekday">{weekday}</span>
        <span className="session-row-day">
          <span className="session-row-month">{month} </span>
          {day}
          {onStrava && <span className="session-row-dot" />}
        </span>
      </span>
      <span className="session-row-main">
        <span className="session-row-title">{title}</span>
        <span className="session-row-meta">{sessionMetaLabel(session)}</span>
        {session.tags.length > 0 && (
          <span className="session-row-tags">
            {session.tags.map((tag) => (
              <span key={tag.id} className="session-row-tag">
                {tag.name.toUpperCase()}
              </span>
            ))}
          </span>
        )}
      </span>
      <span className="session-row-stats">
        {sessionGradeLabels(session).map((g) => (
          <span
            key={g.kind}
            style={{
              fontFamily: "var(--font-mono)",
              fontWeight: g.kind === "sent" ? 600 : 500,
              color: g.kind === "sent" ? "var(--text-label-accent)" : "rgba(64,63,76,0.55)",
              letterSpacing: "0.04em",
            }}
          >
            {g.label}
          </span>
        ))}
      </span>
      <span className="session-row-badge">
        {onStrava && (
          <span
            style={{
              display: "inline-block",
              fontFamily: "var(--font-mono)",
              fontWeight: 500,
              fontSize: 10,
              letterSpacing: "0.08em",
              borderRadius: "var(--radius-pill)",
              padding: "3px 9px",
              whiteSpace: "nowrap",
              border: "1px solid rgba(27,98,206,0.4)",
              color: "var(--bs-azure-ink)",
            }}
          >
            ON STRAVA
          </span>
        )}
      </span>
      <span className="session-row-chevron">›</span>
    </Link>
  );
}
