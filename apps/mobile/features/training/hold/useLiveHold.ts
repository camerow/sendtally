import { useAudioPlayer } from "expo-audio";
import restSound from "../../../assets/sounds/rest.wav";
import tickSound from "../../../assets/sounds/tick.wav";
import workSound from "../../../assets/sounds/work.wav";
import { useLiveHold as useStoredLiveHold } from "@sendtally/features/workouts";
import { liveRun } from "../../live-session/liveRun";

/**
 * Plays the live run's hold, open or minimised, and records it at its target while no player is
 * open, so its rest runs on the strip. Mounted once, at the app's root.
 */
export function useLiveHold(): void {
  const players = {
    tick: useAudioPlayer(tickSound),
    work: useAudioPlayer(workSound),
    rest: useAudioPlayer(restSound),
  };
  useStoredLiveHold(liveRun, (sound) => {
    const player = players[sound];
    void player.seekTo(0);
    player.play();
  });
}
