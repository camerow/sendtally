import React from "react";
import type { Phase } from "@sendtally/core/hang";
import {
  HANG_ON_DARK,
  HANG_TRACK,
  ON_DARK_LINE,
  ON_DARK_MUTED,
  ON_DARK_SOFT,
  ON_DARK_TRACK,
  REST_ON_DARK,
  REST_TRACK,
  type HangTimer,
} from "@sendtally/features/workouts";
import { useWakeLock } from "../../../lib/useWakeLock";
import { RunProgressBar } from "./RunProgressBar";
import { TimerControls, type TimerControlsProps } from "./TimerControls";
import { TimerHeader } from "./TimerHeader";
import { usePhaseProgress } from "./usePhaseProgress";

const ON_DARK_VARS = {
  "--on-dark-soft": ON_DARK_SOFT,
  "--on-dark-muted": ON_DARK_MUTED,
  "--on-dark-line": ON_DARK_LINE,
  "--on-dark-track": ON_DARK_TRACK,
  "--hang-on-dark": HANG_ON_DARK,
  "--rest-on-dark": REST_ON_DARK,
  "--hang-track": HANG_TRACK,
  "--rest-track": REST_TRACK,
} as React.CSSProperties;

export type TimerFrameProps<P extends Phase> = {
  timer: HangTimer<P>;
  name: string;
  meta: string;
  workoutId: string | null;
  controls: Omit<TimerControlsProps, "onRestart" | "onSkip">;
  children: React.ReactNode;
};

/**
 * The dark timer page, with the screen kept on: the live header, the run's phase bar, the
 * page's own middle, and the controls, in one 560 column.
 */
export function TimerFrame<P extends Phase>({
  timer,
  name,
  meta,
  workoutId,
  controls,
  children,
}: TimerFrameProps<P>): React.ReactElement {
  useWakeLock();
  const progress = usePhaseProgress(timer.run);
  return (
    <div className="timer" style={ON_DARK_VARS}>
      <div className="timer-column" ref={progress}>
        <TimerHeader
          name={name}
          meta={meta}
          workoutId={workoutId}
          muted={timer.muted}
          onEnd={timer.end}
          onToggleMute={timer.toggleMute}
        />
        <div className="timer-body">
          <RunProgressBar run={timer.run} />
          {children}
          <TimerControls {...controls} onRestart={timer.restart} onSkip={timer.skip} />
        </div>
      </div>
    </div>
  );
}
