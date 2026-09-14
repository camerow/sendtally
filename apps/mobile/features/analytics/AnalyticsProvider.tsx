import { useUser } from "@clerk/clerk-expo";
import React from "react";
import { PostHogProvider, usePostHog } from "posthog-react-native";
import { IS_E2E, POSTHOG_API_KEY, POSTHOG_HOST } from "../../lib/config";

function IdentifyUser(): null {
  const posthog = usePostHog();
  const { user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress;

  React.useEffect(() => {
    if (!user) return;
    posthog.identify(user.id, {
      ...(email ? { email } : {}),
      ...(IS_E2E ? { $internal_or_test_user: true } : {}),
    });
  }, [posthog, user, email]);

  return null;
}

export function AnalyticsProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  if (!POSTHOG_API_KEY) return <>{children}</>;

  return (
    <PostHogProvider
      apiKey={POSTHOG_API_KEY}
      options={{ host: POSTHOG_HOST, enableSessionReplay: true }}
      autocapture
    >
      <IdentifyUser />
      {children}
    </PostHogProvider>
  );
}
