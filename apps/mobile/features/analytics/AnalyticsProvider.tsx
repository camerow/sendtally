import { useUser } from "@clerk/clerk-expo";
import React from "react";
import { PostHogProvider, usePostHog } from "posthog-react-native";
import { IS_E2E, POSTHOG_API_KEY, POSTHOG_HOST } from "../../lib/config";
import type { Capture } from "@sendtally/features/settings";
import { ScreenTracker } from "./ScreenTracker";
import { CaptureContext } from "./useCapture";

function IdentifyUser(): null {
  const posthog = usePostHog();
  const { user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress;

  React.useEffect(() => {
    if (!user) return;
    posthog.identify(user.id, email ? { email } : undefined);
  }, [posthog, user, email]);

  return null;
}

export function ProvideCapture({ children }: { children: React.ReactNode }): React.ReactElement {
  const posthog = usePostHog();
  const capture = React.useCallback<Capture>(
    (event, properties) => {
      try {
        posthog.capture(event, properties);
      } catch (error: unknown) {
        console.warn(`capture ${event} failed`, error);
      }
    },
    [posthog]
  );
  return <CaptureContext.Provider value={capture}>{children}</CaptureContext.Provider>;
}

export function AnalyticsProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  // Person-on-events keeps an event's person properties as they were at ingestion, so a
  // flow's anonymous events stay product traffic however the person is marked later. Sending
  // nothing is the only thing that actually keeps a CI run out, and it stops session replay
  // recording one too.
  if (!POSTHOG_API_KEY || IS_E2E) return <>{children}</>;

  return (
    <PostHogProvider
      apiKey={POSTHOG_API_KEY}
      options={{
        host: POSTHOG_HOST,
        enableSessionReplay: true,
        sessionReplayConfig: {
          maskAllTextInputs: false,
          maskAllImages: true,
          maskAllSandboxedViews: true,
        },
      }}
      autocapture={{ captureTouches: true, captureScreens: false }}
    >
      <IdentifyUser />
      <ScreenTracker />
      <ProvideCapture>{children}</ProvideCapture>
    </PostHogProvider>
  );
}
