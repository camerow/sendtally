import React from "react";
import { clock, phasesFor, type HangWorkout } from "@sendtally/core/hang";
import { hangLoadText } from "@sendtally/features/activities";
import { humanDuration } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { ExerciseBlock } from "../components/ExerciseBlock";
import { ExerciseHead } from "../components/ExerciseHead";
import { PhaseBar } from "../components/PhaseBar";
import { useHangData } from "../data/HangDataContext";
import { gripPath } from "../exercises/paths";

export type ProtocolPanelProps = { workout: HangWorkout; gripId: string };

/** A hangboard workout's grip on its page: its session as labelled numbers, then the phase bar. */
export function ProtocolPanel({ workout, gripId }: ProtocolPanelProps): React.ReactElement {
  const { model } = useHangData();
  const hang = workout.kind === "hang";
  const setup = model.setup(workout, gripId);
  const stats = [
    { label: t("hang.statSets"), value: String(workout.sets) },
    hang
      ? { label: t("hang.statHangsASet"), value: String(workout.reps) }
      : { label: t("plan.colReps"), value: String(workout.reps) },
    ...(hang
      ? [
          workout.reps > 1
            ? {
                label: t("hang.statOnOff"),
                value: `${humanDuration(workout.hangS)} / ${humanDuration(workout.restS)}`,
              }
            : { label: t("hang.statOn"), value: humanDuration(workout.hangS) },
        ]
      : []),
    { label: t("plan.colSetRest"), value: clock(workout.setRestS) },
    ...(hang ? [{ label: t("plan.colEdge"), value: t("hang.edgeMm", { n: setup.edgeMm }) }] : []),
    { label: t("hang.load"), value: hangLoadText(setup.loadKg, model.settings.units) },
  ];
  return (
    <ExerciseBlock head={<ExerciseHead name={model.gripName(gripId)} history={gripPath(gripId)} />}>
      <dl className="stat-grid stat-grid--compact">
        {stats.map((s) => (
          <div key={s.label}>
            <dt className="train-label train-label--small">{s.label}</dt>
            <dd>{s.value}</dd>
          </div>
        ))}
      </dl>
      <div className="protocol-bar">
        <PhaseBar phases={phasesFor(workout).slice(1)} height={14} />
      </div>
      <span className="swatches">
        <span className="swatch swatch--work">{hang ? t("hang.kindHang") : t("hang.lifts")}</span>
        <span className="swatch swatch--rest">{t("hang.rest")}</span>
      </span>
    </ExerciseBlock>
  );
}
