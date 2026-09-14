import { Redirect } from "expo-router";
import React from "react";

/** Strava's callback lands here when the auth session was not the one to catch it (Android cold start). */
export default function ConnectedStrava(): React.ReactElement {
  return <Redirect href="/(tabs)/settings" />;
}
