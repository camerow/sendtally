import * as Updates from "expo-updates";
import React from "react";
import { Image } from "react-native";
import { colors } from "@sendtally/design/tokens";
import splashMark from "../assets/splash-mark.png";

const MAX_SPLASH_HOLD_MS = 10_000;
const SPLASH_MARK_SIZE = 180;
const holdsSplash = Updates.isEnabled && Updates.isEmbeddedLaunch && !Updates.isEmergencyLaunch;

/**
 * A fresh install runs the bundle embedded in the store build, which is usually behind the
 * production channel. On that launch only, keep the splash up while expo-updates checks and
 * downloads, then reload straight into the update instead of waiting for the next cold start.
 */
export function useFreshInstallUpdate(): boolean {
  const { isStartupProcedureRunning, isUpdatePending } = Updates.useUpdates();
  const [gaveUp, setGaveUp] = React.useState(false);

  React.useEffect(() => {
    if (!holdsSplash) return;
    const timer = setTimeout(() => setGaveUp(true), MAX_SPLASH_HOLD_MS);
    return () => clearTimeout(timer);
  }, []);

  React.useEffect(() => {
    if (holdsSplash && isUpdatePending && !gaveUp) {
      Updates.reloadAsync({ reloadScreenOptions: splashLookalike() }).catch(() => setGaveUp(true));
    }
  }, [isUpdatePending, gaveUp]);

  return !holdsSplash || gaveUp || (!isStartupProcedureRunning && !isUpdatePending);
}

function splashLookalike(): Updates.ReloadScreenOptions {
  return {
    backgroundColor: colors.gold,
    image: {
      url: Image.resolveAssetSource(splashMark).uri,
      width: SPLASH_MARK_SIZE,
      height: SPLASH_MARK_SIZE,
    },
    fade: true,
  };
}
