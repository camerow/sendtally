import React from "react";
import type { SessionRow } from "@sendtally/api-client";
import { formatDate, t } from "@sendtally/features/i18n";
import { isoDay } from "@sendtally/features/journal";
import { sessionTitle } from "@sendtally/features/sessions";
import { SessionRowBody } from "../../sessions/components/SessionRowBody";

const label: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontWeight: 500,
  fontSize: 11,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "rgba(64,63,76,0.72)",
};

const optionLabel = (session: SessionRow): string => {
  const day = formatDate(new Date(session.start_at), {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
  return `${day} · ${sessionTitle(session)}`;
};

/**
 * Adding a session is the same native select the climb grade uses, so it keeps
 * the platform's keyboard, type-to-search and mobile wheel. What is already
 * linked sits underneath as log rows, because a session should look the same
 * wherever it is listed. A trip is several days of climbing, so this is a list.
 */
export function SessionPicker({
  sessions,
  occurredAt,
  endsAt,
  value,
  onChange,
}: {
  sessions: SessionRow[];
  occurredAt: string;
  endsAt: string;
  value: string[];
  onChange: (fingerprints: string[]) => void;
}): React.ReactElement | null {
  const linked = React.useMemo(
    () =>
      sessions
        .filter((s) => value.includes(s.fingerprint))
        .sort((a, b) => b.start_at.localeCompare(a.start_at)),
    [sessions, value]
  );

  const available = React.useMemo(
    () =>
      sessions
        .filter((s) => !value.includes(s.fingerprint))
        .sort((a, b) => b.start_at.localeCompare(a.start_at)),
    [sessions, value]
  );

  if (sessions.length === 0) return null;

  // What the entry's own dates cover, which in every doorway is what it is about.
  const to = endsAt === "" ? occurredAt : endsAt;
  const inSpan = available.filter((s) => {
    const day = isoDay(s.start_at);
    return day >= occurredAt && day <= to;
  });
  const rest = available.filter((s) => !inSpan.includes(s));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <label style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        <span style={label}>{t("journal.sessions")}</span>
        {available.length > 0 && (
          <select
            value=""
            onChange={(e) => {
              if (e.target.value !== "") onChange([...value, e.target.value]);
            }}
            className="log-session-control"
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 15,
              color: "rgba(64,63,76,0.45)",
              background: "var(--bs-white)",
              border: "1px solid rgba(64,63,76,0.15)",
              borderRadius: "var(--radius-control)",
              padding: "12px 14px",
              outline: "none",
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            <option value="">
              {value.length === 0 ? t("journal.linkASession") : t("journal.linkAnother")}
            </option>
            {inSpan.length > 0 && (
              <optgroup label={t("journal.theseDates")}>
                {inSpan.map((s) => (
                  <option key={s.fingerprint} value={s.fingerprint}>
                    {optionLabel(s)}
                  </option>
                ))}
              </optgroup>
            )}
            <optgroup label={t("journal.recent")}>
              {rest.map((s) => (
                <option key={s.fingerprint} value={s.fingerprint}>
                  {optionLabel(s)}
                </option>
              ))}
            </optgroup>
          </select>
        )}
      </label>

      {linked.length > 0 && (
        <div className="sessions-rows">
          {linked.map((session) => (
            <div key={session.fingerprint} className="session-row">
              <SessionRowBody session={session} title={sessionTitle(session)} />
              <button
                type="button"
                aria-label={t("journal.unlinkSession")}
                onClick={() => onChange(value.filter((f) => f !== session.fingerprint))}
                className="session-row-remove"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
