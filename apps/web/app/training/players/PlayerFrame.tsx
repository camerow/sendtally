import React from "react";
import { t } from "@sendtally/features/i18n";
import type { WorkoutRun } from "@sendtally/features/workouts";
import { DetailFrame } from "../../components/detail/DetailFrame";
import { PlayerClock } from "./PlayerClock";
import { PlayerHeader } from "./PlayerHeader";

export type PlayerFrameProps = {
  run: WorkoutRun;
  startedAt: number;
  /** The button that ends the run, sticky at the foot. */
  footer: React.ReactNode;
  children: React.ReactNode;
};

/** A player page: Minimise and the clock from Start over the workout's header, its rows, and its finish. */
export function PlayerFrame({
  run,
  startedAt,
  footer,
  children,
}: PlayerFrameProps): React.ReactElement {
  return (
    <DetailFrame
      backTo="/app/plan"
      backLabel={t("tally.minimise")}
      action={<PlayerClock startedAt={startedAt} />}
      footer={footer}
    >
      <PlayerHeader kind={run.kind} title={run.title} workoutId={run.workoutId} />
      <div className="player-rows">{children}</div>
    </DetailFrame>
  );
}
