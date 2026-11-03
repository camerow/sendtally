import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import React from "react";
import { AppState } from "react-native";
import * as NativeTimer from "../../modules/native-timer";
import { holdEndsAt } from "../training/hold/holdClock";
import { prepareTimerNotifications } from "../training/reminders/notifications";
import { readLiveRun, useLiveRun, type LiveRun } from "./liveRun";
import { isCounting, nativeTimerOf } from "./nativeTimer";

const KEEP_AWAKE = "live-run";

let prepared: Promise<void> | null = null;

/** When a rest or hold stops counting on its own, so the screen can sleep again. */
const stopsAt = (live: LiveRun | null): number | null =>
  live?.hold !== undefined ? holdEndsAt(live.hold) : (live?.rest?.endsAt ?? null);

/**
 * Hands the live run to the system timer on every change and every return to the app, and keeps
 * the screen on while its clock counts. Mounted once, at the app's root.
 */
export function useNativeTimer(): void {
  const live = useLiveRun();
  const [now, setNow] = React.useState(Date.now);

  React.useEffect(() => {
    const send = (): void => {
      const payload = nativeTimerOf(live, Date.now());
      if (payload === null) return NativeTimer.sync(null);
      prepared ??= prepareTimerNotifications().catch(() => undefined);
      void prepared.then(() => NativeTimer.sync(nativeTimerOf(readLiveRun(), Date.now())));
    };
    send();
    const sub = AppState.addEventListener("change", (state) => {
      if (state !== "active") return;
      setNow(Date.now());
      send();
    });
    return () => sub.remove();
  }, [live]);

  const counting = isCounting(live, now);
  const until = stopsAt(live);
  React.useEffect(() => {
    if (!counting || until === null) return;
    const timer = setTimeout(() => setNow(Date.now()), Math.max(0, until - Date.now()));
    return () => clearTimeout(timer);
  }, [counting, until]);

  React.useEffect(() => {
    if (!counting) return;
    void activateKeepAwakeAsync(KEEP_AWAKE);
    return () => void deactivateKeepAwake(KEEP_AWAKE);
  }, [counting]);
}
