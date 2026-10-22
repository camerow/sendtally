import { useAuth } from "@clerk/clerk-expo";
import { useIsRestoring } from "@tanstack/react-query";
import { Redirect } from "expo-router";
import React from "react";
import { useTrainingMode } from "@sendtally/features/settings";
import { useApi } from "../lib/api";

function SignedInStart(): React.ReactElement | null {
  const restoring = useIsRestoring();
  const { enabled } = useTrainingMode(useApi());
  if (restoring) return null;
  return <Redirect href={enabled ? "/(tabs)/today" : "/(tabs)/sessions"} />;
}

export default function Index(): React.ReactElement | null {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return null;
  return isSignedIn ? <SignedInStart /> : <Redirect href="/onboarding" />;
}
