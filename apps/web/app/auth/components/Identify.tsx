import { useUser } from "@clerk/react-router";
import React from "react";
import { identify, resetIdentity } from "../../lib/analytics";

/**
 * Ties browser events to the same key the Worker uses (the Clerk user id) and
 * puts the email on the person, which is what the project's internal-user
 * cohort filters us out by.
 */
export function Identify(): null {
  const { isLoaded, isSignedIn, user } = useUser();
  const identified = React.useRef(false);

  React.useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn && user !== null && user !== undefined) {
      identified.current = true;
      identify(user.id, {
        email: user.primaryEmailAddress?.emailAddress,
        name: user.fullName ?? undefined,
        created_at: user.createdAt?.toISOString(),
      });
      return;
    }
    // Only on the way out: resetting on every anonymous page load would break
    // the anonymous-to-signed-up funnel by cutting the distinct id.
    if (identified.current) {
      identified.current = false;
      resetIdentity();
    }
  }, [isLoaded, isSignedIn, user]);

  return null;
}
