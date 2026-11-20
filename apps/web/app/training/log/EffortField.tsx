import React from "react";
import { effortColor } from "@sendtally/design/tokens";
import { effortWord } from "@sendtally/features/hang";
import { formatNumber, t } from "@sendtally/features/i18n";

const LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

export type EffortFieldProps = {
  value: number | null;
  /** The session's Target RPE, beside the label. */
  target?: number;
  onChange: (rpe: number | null) => void;
};

/** RPE: optional, ten bars rising with it, the number and its word, clearable; its target beside the label. */
export function EffortField({ value, target, onChange }: EffortFieldProps): React.ReactElement {
  return (
    <div className="form-section">
      <span className="effort-head">
        <span className="train-label">RPE</span>
        {target !== undefined && (
          <span className="effort-target">
            {t("common.targetRpe", { n: formatNumber(target) })}
          </span>
        )}
      </span>
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
