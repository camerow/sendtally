import React from "react";
import type { HangKind, WeightUnit } from "@sendtally/core/hang";
import { loadShares, type GripLoad } from "@sendtally/features/activities";
import { loadLabel } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";

const MIN = 4;
const HIGH = 70;

export type GripTrendProps = {
  /** Every session on the grip, oldest first. */
  sessions: readonly GripLoad[];
  kind: HangKind;
  currentId: string;
  unit: WeightUnit;
};

/** The added weight on this grip, session by session, this one in gold. */
export function GripTrend({
  sessions,
  kind,
  currentId,
  unit,
}: GripTrendProps): React.ReactElement | null {
  if (sessions.length < 2) return null;
  const loads = sessions.map((s) => s.loadKg);
  const shares = loadShares(loads);
  const label = (kg: number): string => loadLabel(kind, kg, unit);
  return (
    <div className="trend-card">
      <div className="trend-card-head">
        <span className="train-label" style={{ color: "var(--bs-gunmetal)" }}>
          {t("summary.addedWeight")}
        </span>
        <span className="trend-card-name">
          {t("hang.sessionCount", { count: sessions.length })}
        </span>
      </div>
      <div
        role="img"
        aria-label={t("statistics.exerciseChart", {
          exercise: t("summary.addedWeight"),
          from: label(loads[0] ?? 0),
          to: label(loads.at(-1) ?? 0),
        })}
        className="grip-bars"
      >
        {sessions.map((s, i) => (
          <span
            key={s.id}
            style={{
              height: Math.max(MIN, (shares[i] ?? 0) * HIGH),
              background: s.id === currentId ? "var(--bs-gold)" : "rgba(64,63,76,0.3)",
            }}
          />
        ))}
      </div>
    </div>
  );
}
