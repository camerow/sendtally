import React from "react";
import type { HangSession, WeightUnit } from "@sendtally/core/hang";
import { loadLabel } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";

const LOW = 10;
const HIGH = 70;

export type GripTrendProps = {
  /** Every session on the grip, oldest first. */
  sessions: readonly Pick<HangSession, "id" | "loadKg" | "protocol">[];
  currentId: string;
  unit: WeightUnit;
};

/** The added weight on this grip, session by session, this one in gold. */
export function GripTrend({
  sessions,
  currentId,
  unit,
}: GripTrendProps): React.ReactElement | null {
  const [first] = sessions;
  if (first === undefined || sessions.length < 2) return null;
  const loads = sessions.map((s) => s.loadKg);
  const [lo, hi] = [Math.min(...loads), Math.max(...loads)];
  const height = (kg: number): number => LOW + ((kg - lo) / (hi - lo || 1)) * (HIGH - LOW);
  const label = (kg: number): string => loadLabel(first.protocol.kind, kg, unit);
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
          from: label(first.loadKg),
          to: label(loads.at(-1) ?? first.loadKg),
        })}
        className="grip-bars"
      >
        {sessions.map((s) => (
          <span
            key={s.id}
            style={{
              height: height(s.loadKg),
              background: s.id === currentId ? "var(--bs-gold)" : "rgba(64,63,76,0.3)",
            }}
          />
        ))}
      </div>
    </div>
  );
}
