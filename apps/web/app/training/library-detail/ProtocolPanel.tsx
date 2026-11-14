import React from "react";
import { phasesFor, timeOnEdge, type HangWorkout } from "@sendtally/core/hang";
import { humanDuration, protocolSummary } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { durationLabel } from "@sendtally/features/sessions";
import { PhaseBar } from "../components/PhaseBar";

export type ProtocolPanelProps = {
  workout: HangWorkout;
  /** The workout's planned length, as its cards and meta line read it. */
  minutes: number | null;
};

/** The phase bar with its legend, the summary line, and the headline numbers. */
export function ProtocolPanel({ workout, minutes }: ProtocolPanelProps): React.ReactElement {
  const hang = workout.kind === "hang";
  const stats = [
    { label: t("hang.statDuration"), value: minutes === null ? "-" : durationLabel(minutes) },
    hang
      ? { label: t("hang.statOnEdge"), value: humanDuration(timeOnEdge(workout)) }
      : { label: t("hang.statTotalLifts"), value: String(workout.reps * workout.sets) },
    {
      label: t("hang.statSets"),
      value: hang ? `${workout.sets} × ${workout.reps}` : String(workout.sets),
    },
  ];
  return (
    <section className="detail-section protocol">
      <div className="protocol-head">
        <h2 className="detail-label">{t("hang.protocol")}</h2>
        <span className="swatches">
          <span className="swatch swatch--work">{hang ? t("hang.kindHang") : t("hang.lifts")}</span>
          <span className="swatch swatch--rest">{t("hang.rest")}</span>
        </span>
      </div>
      <PhaseBar phases={phasesFor(workout).slice(1)} height={14} />
      <span className="protocol-summary">{protocolSummary(workout, workout.timeUnits)}</span>
      <dl className="stat-grid">
        {stats.map((s) => (
          <div key={s.label}>
            <dt className="train-label">{s.label}</dt>
            <dd>{s.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
