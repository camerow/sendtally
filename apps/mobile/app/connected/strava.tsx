import { useTrainingMode } from "@sendtally/features/settings";
import { Redirect } from "expo-router";
import React from "react";
import { useApi } from "../../lib/api";

/** Strava's callback lands here when the auth session was not the one to catch it (Android cold start). */
export default function ConnectedStrava(): React.ReactElement {
  const { enabled } = useTrainingMode(useApi());
  return <Redirect href={enabled ? "/profile" : "/(tabs)/settings"} />;
}
