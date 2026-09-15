import React from "react";
import { t } from "@sendtally/features/i18n";

const label: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontWeight: 500,
  fontSize: 11,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "rgba(64,63,76,0.72)",
};

/**
 * The RPE picker's strip, one control lower and in watermelon, so two stacked
 * strips never read as one question. Both carry a label and a number.
 */
export function SeverityPicker({
  severity,
  onChange,
}: {
  severity: number | null;
  onChange: (severity: number | null) => void;
}): React.ReactElement {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <span style={label}>{t("journal.howDidItFeel")}</span>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontWeight: 600,
            fontSize: 17,
            color: "var(--bs-watermelon-ink)",
          }}
        >
          {severity === null ? (
            <span style={{ fontSize: 12, color: "rgba(64,63,76,0.55)" }}>
              {t("journal.severityScale")}
            </span>
          ) : (
            <>
              {severity}
              <span style={{ fontSize: 12, opacity: 0.6 }}>/10</span>
            </>
          )}
        </span>
      </div>
      <div style={{ display: "flex", gap: 3 }}>
        {Array.from({ length: 11 }, (_, value) => {
          const lit = severity !== null && value <= severity && value > 0;
          const zeroPicked = severity === 0 && value === 0;
          return (
            <button
              key={value}
              type="button"
              aria-label={t("journal.severityValue", { n: value })}
              aria-pressed={severity === value}
              onClick={() => onChange(severity === value ? null : value)}
              className="log-session-rpe"
              style={{
                flex: 1,
                borderRadius: 4,
                border: "none",
                cursor: "pointer",
                background:
                  lit || zeroPicked ? "var(--bs-watermelon-ink)" : "var(--data-bar-empty)",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
