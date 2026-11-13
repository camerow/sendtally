import React from "react";
import { effortColor } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";

const LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

/** The effort a workout aims for: optional, ten bars, clearable. */
export function TargetEffort({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (rpe: number | null) => void;
}): React.ReactElement {
  return (
    <div className="form-section">
      <span className="target-head">
        <span className="train-label">
          {value === null ? t("plan.targetEffort") : t("plan.targetValue", { n: value })}
        </span>
        {value !== null && (
          <button type="button" className="text-button" onClick={() => onChange(null)}>
            {t("hang.clear")}
          </button>
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
    </div>
  );
}
