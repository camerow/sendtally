import React from "react";
import type { ImportSession } from "@sendtally/core/import";
import { planStats, sessionTitle } from "@sendtally/features/import";
import type { GradeScales } from "@sendtally/features/sessions";
import { formatDate, formatNumber, t } from "@sendtally/features/i18n";
import { monoMuted } from "../../settings/components/styles";
import { checkbox } from "../styles";

export const dayLabel = (date: string): string =>
  formatDate(new Date(`${date}T00:00:00Z`), {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

function rowMeta(session: ImportSession, scales: GradeScales): string {
  const sends = session.climbs.filter((c) => c.kind === "send");
  const top = planStats([{ ...session, climbs: sends }], scales).topGrade;
  return [
    dayLabel(session.date),
    t("tally.sentCount", { count: sends.length }),
    ...(top === null ? [] : [t("sessions.topSend", { grade: top })]),
  ].join(" · ");
}

const oneLine: React.CSSProperties = {
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

export type ImportSessionRowProps = {
  session: ImportSession;
  scales: GradeScales;
  borderBottom: string;
  /** Present where rows are picked for tagging, as on the Account import page. */
  selection?: { checked: boolean; disabled: boolean; onToggle: () => void };
};

export function ImportSessionRow({
  session,
  scales,
  borderBottom,
  selection,
}: ImportSessionRowProps): React.ReactElement {
  const name = sessionTitle(session) ?? t("common.climbingSession");
  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "12px 18px",
        borderBottom,
        background: selection?.checked === true ? "var(--surface-soft)" : "transparent",
        cursor: selection === undefined ? "default" : "pointer",
      }}
    >
      {selection !== undefined && (
        <input
          type="checkbox"
          checked={selection.checked}
          disabled={selection.disabled}
          aria-label={t("import.selectSession", { name, date: dayLabel(session.date) })}
          onChange={selection.onToggle}
          style={checkbox}
        />
      )}
      <span style={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
        <span style={{ ...oneLine, fontWeight: 600 }}>{name}</span>
        <span style={{ ...monoMuted, ...oneLine }}>{rowMeta(session, scales)}</span>
        {session.tags !== undefined && (
          <span style={{ ...monoMuted, color: "var(--bs-petal-ink)" }}>
            {session.tags.join(" · ")}
          </span>
        )}
      </span>
      {session.rpe !== undefined && (
        <span style={{ ...monoMuted, color: "var(--bs-gunmetal)", flexShrink: 0 }}>
          RPE {formatNumber(session.rpe)}
        </span>
      )}
    </label>
  );
}
