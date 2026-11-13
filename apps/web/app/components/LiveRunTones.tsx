import React from "react";
import { useLiveHold, useRestTone } from "@sendtally/features/workouts";
import { useLiveRunStore } from "../lib/useLiveRun";
import { playTone, unlockTones } from "../lib/tones";

/**
 * The live run's hold cues and its rest's end tone, open or minimised, and its hold recorded at
 * its target while no player is open. Mounted once, in the app shell.
 */
export function LiveRunTones(): null {
  const store = useLiveRunStore();
  useLiveHold(store, playTone);
  useRestTone(store, () => playTone("work"));
  React.useEffect(() => {
    window.addEventListener("pointerdown", unlockTones, { once: true });
    window.addEventListener("keydown", unlockTones, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlockTones);
      window.removeEventListener("keydown", unlockTones);
    };
  }, []);
  return null;
}
