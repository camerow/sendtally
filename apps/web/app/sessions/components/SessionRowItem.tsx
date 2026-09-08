import React from "react";
import { Link } from "react-router";
import { Badge } from "@sendtally/design";
import type { SessionRow } from "@sendtally/api-client";
import {
  SESSION_BADGE_LABELS,
  durationLabel,
  sessionGradeLabels,
  sessionMinutes,
  type SessionBadge,
} from "@sendtally/features/sessions";

const BADGE_STYLES: Record<SessionBadge, { border: string; color: string }> = {
  in_progress: {
    border: "1px solid rgba(196,48,61,0.4)",
    color: "var(--bs-watermelon-ink)",
  },
  on_strava: {
    border: "1px solid rgba(27,98,206,0.4)",
    color: "var(--bs-azure-ink)",
  },
};

export function SessionRowItem({
  session,
  title,
  badge,
}: {
  session: SessionRow;
  title: string;
  badge: SessionBadge | null;
}): React.ReactElement {
  const start = new Date(session.start_at);
  return (
    <Link to={`/app/sessions/${encodeURIComponent(session.fingerprint)}`} className="session-row">
      <span
        className="session-row-date"
        style={{ display: "flex", flexDirection: "column", gap: 3 }}
      >
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontWeight: 500,
            fontSize: 10,
            color: "rgba(64,63,76,0.55)",
            letterSpacing: "0.08em",
          }}
        >
          {start.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" }).toUpperCase()}
        </span>
        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 16 }}>
          {start.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}
        </span>
      </span>
      <span
        className="session-row-main"
        style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}
      >
        <span
          style={{
            fontWeight: 600,
            fontSize: 15,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {title}
        </span>
        <span
          style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "rgba(64,63,76,0.55)" }}
        >
          {durationLabel(sessionMinutes(session))} · RPE {session.rpe}/10
        </span>
        {session.tags.length > 0 && (
          <span style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 3 }}>
            {session.tags.map((tag) => (
              <Badge key={tag.id} tone="petal" style={{ fontSize: 9, padding: "3px 7px" }}>
                {tag.name.toUpperCase()}
              </Badge>
            ))}
          </span>
        )}
      </span>
      <span
        className="session-row-stats"
        style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}
      >
        <span style={{ fontFamily: "var(--font-mono)", color: "rgba(64,63,76,0.72)" }}>
          {session.climb_count} climbs
        </span>
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
        {badge !== null && (
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
              border: BADGE_STYLES[badge].border,
              color: BADGE_STYLES[badge].color,
            }}
          >
            {SESSION_BADGE_LABELS[badge]}
          </span>
        )}
      </span>
      <span
        className="session-row-chevron"
        style={{
          fontFamily: "var(--font-mono)",
          fontWeight: 600,
          fontSize: 16,
          color: "rgba(64,63,76,0.35)",
        }}
      >
        ›
      </span>
    </Link>
  );
}
