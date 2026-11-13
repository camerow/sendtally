import React from "react";
import { effortColor } from "@sendtally/design/tokens";
import { effortWord } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";

const LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

export type EffortFieldProps = { value: number | null; onChange: (rpe: number | null) => void };

/** Effort: optional, ten bars rising with it, the number and its word, clearable. */
export function EffortField({ value, onChange }: EffortFieldProps): React.ReactElement {
  return (
    <div className="form-section">
      <span className="train-label">{t("common.effort")}</span>
      <div className="effort-bars">
        {LEVELS.map((level) => (
          <button
            key={level}
            type="button"
            aria-label={t("common.effortValue", { n: level })}
            aria-pressed={value === level}
            onClick={() => onChange(level)}
          >
            <span
              style={{
                height: 14 + (level - 1) * (38 / 9),
                background:
                  value !== null && level <= value ? effortColor(value) : "var(--data-bar-empty)",
              }}
            />
          </button>
        ))}
      </div>
      {value !== null && (
        <div className="effort-read">
          <span className="effort-value">
            {value}
            <small>/10</small>
          </span>
          <span className="effort-word">{effortWord(value)}</span>
          <button type="button" className="text-button" onClick={() => onChange(null)}>
            {t("hang.clear")}
          </button>
        </div>
      )}
    </div>
  );
}
