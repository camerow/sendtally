import { useSegments } from "expo-router";
import React from "react";
import { usePostHog } from "posthog-react-native";

// expo-router never exposes its NavigationContainer, so posthog's captureScreens
// autocapture cannot see navigation and screens have to be sent by hand. Segments
// are the route pattern, so `/session/abc123` reports as `session/[fingerprint]`
// and one screen stays one row instead of one per id.
export function ScreenTracker(): null {
  const posthog = usePostHog();
  const screen = useSegments().join("/");

  React.useEffect(() => {
    if (screen === "") return;
    posthog.screen(screen);
  }, [posthog, screen]);

  return null;
}
