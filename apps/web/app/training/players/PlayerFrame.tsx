import React from "react";
import type { WorkoutRun } from "@sendtally/features/workouts";
import { DetailFrame } from "../../components/detail/DetailFrame";
import { PlayerClock } from "./PlayerClock";
import { PlayerHeader } from "./PlayerHeader";

export type PlayerFrameProps = {
  run: WorkoutRun;
  startedAt: number;
  /** Where the run is: "Exercise 2 of 3". */
  position?: { at: number; of: number } | null;
  /** Where a workout with climbing in it is climbed, which picks another. */
  gym?: { name: string | undefined; onPick: () => void } | undefined;
  /** The button that ends the run, sticky at the foot. */
  footer: React.ReactNode;
  children: React.ReactNode;
};

/** A player page: Minimise and the clock from Start over the workout's header, its rows, and its finish. */
export function PlayerFrame({
  run,
  startedAt,
  position = null,
  gym,
  footer,
  children,
}: PlayerFrameProps): React.ReactElement {
  return (
    <DetailFrame
      backTo="/app/plan"
      minimise
      action={<PlayerClock startedAt={startedAt} />}
      footer={footer}
    >
      <PlayerHeader
        kind={run.kind}
        title={run.title}
        workoutId={run.workoutId}
        position={position}
        bare={run.items.length === 0}
        gym={gym}
      />
      <div className="player-rows">{children}</div>
    </DetailFrame>
  );
}
