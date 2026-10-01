import { Redirect } from "expo-router";
import React from "react";

/** Clerk's callback lands here when the auth session was not the one to catch it (Android custom tab). */
export default function SsoCallback(): React.ReactElement {
  return <Redirect href="/sign-in" />;
}
