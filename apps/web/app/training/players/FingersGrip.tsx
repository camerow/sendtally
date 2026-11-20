import React from "react";
import { hangLoadText } from "@sendtally/features/hang";
import { protocolDose, type Dose, type HangSetup, type HangWorkout } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import { targetText } from "@sendtally/features/workouts";
import { ExerciseBlock } from "../components/ExerciseBlock";
import { ExerciseHead } from "../components/ExerciseHead";
import { useSessionTarget } from "../components/sessionTarget";
import { useHangData } from "../data/HangDataContext";
import { gripPath } from "../exercises/paths";

export type FingersGripProps = {
  workout: HangWorkout;
  dose: Dose | undefined;
  /** The setup the timer runs it on, once it has; the one it would start from otherwise. */
  setup: HangSetup | undefined;
};

/** One grip of a mix's fingerboard part before its timer ends: its target, then its edge and load. */
export function FingersGrip({ workout, dose, setup }: FingersGripProps): React.ReactElement {
  const sessionRpe = useSessionTarget();
  const { model } = useHangData();
  const unit = model.settings.units;
  const { edgeMm, loadKg } = setup ?? model.setup(workout, workout.grip, dose);
  const line = [
    workout.kind === "hang" ? t("hang.edgeMm", { n: edgeMm }) : null,
    loadKg === 0 && workout.kind === "hang" ? null : hangLoadText(loadKg, unit),
  ]
    .filter((x) => x !== null)
    .join(" · ");
  return (
    <ExerciseBlock
      head={
        <ExerciseHead
          name={model.gripName(workout.grip)}
          target={targetText(dose ?? protocolDose(workout), "hangboard", unit, { sessionRpe })}
          history={gripPath(workout.grip)}
        />
      }
    >
      <span className="fingers-setup">{line}</span>
    </ExerciseBlock>
  );
}
