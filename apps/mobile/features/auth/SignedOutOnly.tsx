import { useAuth } from "@clerk/clerk-expo";
import { Redirect } from "expo-router";
import React from "react";

/**
 * Guards the screens that only make sense without a session. Clerk rejects
 * `signIn.create()` while one is active ("You're already signed in"), which is what a
 * signed-in user hits when they reach sign-in by deep link or back-navigation.
 */
export function SignedOutOnly({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement | null {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return null;
  if (isSignedIn) return <Redirect href="/(tabs)/sessions" />;
  return <>{children}</>;
}
