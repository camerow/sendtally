import React from "react";
import { useNavigate } from "react-router";
import type { ItemDone } from "@sendtally/core/hang";
import { finishedRunParams, type RunFiling } from "@sendtally/features/workouts";
import { newActivityPath } from "../log/paths";

/**
 * Hands a finished run to its review in place of the player, timed by the player's clock; with
 * `end` set it does so as soon as `ready`, for Record from elsewhere.
 */
export function useFinishRun(
  run: RunFiling,
  finished: () => { done: ItemDone[]; off: string[] },
  startedAt: number,
  end: boolean,
  ready: boolean
): () => void {
  const navigate = useNavigate();
  const finish = (): void => {
    const { done, off } = finished();
    const params = finishedRunParams(run, done, startedAt, Date.now(), off);
    void navigate(newActivityPath(params), { replace: true });
  };
  const ending = React.useRef(end);
  React.useEffect(() => {
    if (!ending.current || !ready) return;
    ending.current = false;
    finish();
  });
  return finish;
}
