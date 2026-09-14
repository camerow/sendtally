import React from "react";
import type { SessionRow } from "@sendtally/api-client";
import { formatDate, t } from "@sendtally/features/i18n";
import { isoDay } from "@sendtally/features/journal";

const label: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontWeight: 500,
  fontSize: 11,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "rgba(64,63,76,0.72)",
};

const optionLabel = (session: SessionRow, title: string): string => {
  const at = new Date(session.start_at);
  const day = formatDate(at, {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
  return `${day} · ${title}`;
};

/**
 * The same native select the climb grade uses, so it inherits the platform's
 * keyboard, type-to-search and mobile wheel. Sessions on the entry's own date
 * come first, which in every doorway is the one being written about.
 */
export function SessionSelect({
  sessions,
  occurredAt,
  value,
  onChange,
  titleOf,
}: {
  sessions: SessionRow[];
  occurredAt: string;
  value: string;
  onChange: (fingerprint: string) => void;
  titleOf: (session: SessionRow) => string;
}): React.ReactElement | null {
  const byDate = React.useMemo(
    () => [...sessions].sort((a, b) => b.start_at.localeCompare(a.start_at)),
    [sessions]
  );
  const sameDay = byDate.filter((s) => isoDay(s.start_at) === occurredAt);
  const rest = byDate.filter((s) => isoDay(s.start_at) !== occurredAt);

  if (sessions.length === 0) return null;

  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 9 }}>
      <span style={label}>{t("journal.session")}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="log-session-control"
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: 15,
          color: value === "" ? "rgba(64,63,76,0.45)" : "var(--bs-gunmetal)",
          background: "var(--bs-white)",
          border: "1px solid rgba(64,63,76,0.15)",
          borderRadius: "var(--radius-control)",
          padding: "12px 14px",
          outline: "none",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <option value="">{t("journal.notAttached")}</option>
        {sameDay.length > 0 && (
          <optgroup label={t("journal.sameDay")}>
            {sameDay.map((s) => (
              <option key={s.fingerprint} value={s.fingerprint}>
                {optionLabel(s, titleOf(s))}
              </option>
            ))}
          </optgroup>
        )}
        <optgroup label={t("journal.recent")}>
          {rest.map((s) => (
            <option key={s.fingerprint} value={s.fingerprint}>
              {optionLabel(s, titleOf(s))}
            </option>
          ))}
        </optgroup>
      </select>
    </label>
  );
}
