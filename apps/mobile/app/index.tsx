import { useAuth } from "@clerk/clerk-expo";
import { useIsRestoring } from "@tanstack/react-query";
import { Redirect } from "expo-router";
import React from "react";

function SignedInStart(): React.ReactElement | null {
  const restoring = useIsRestoring();
  if (restoring) return null;
  return <Redirect href="/(tabs)/today" />;
}

export default function Index(): React.ReactElement | null {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return null;
  return isSignedIn ? <SignedInStart /> : <Redirect href="/onboarding" />;
}
