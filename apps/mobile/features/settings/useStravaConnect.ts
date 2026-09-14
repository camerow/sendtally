import { makeRedirectUri } from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import React from "react";
import { t } from "@sendtally/features/i18n";
import type { SendtallyApi } from "@sendtally/api-client";

export type StravaConnectFeature = {
  connect: () => void;
  busy: boolean;
  error: string | null;
};

/** Runs Strava's authorization in an auth session; the Worker's callback returns to sendtally://connected/strava. */
export function useStravaConnect(api: SendtallyApi, onConnected: () => void): StravaConnectFeature {
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const connect = React.useCallback((): void => {
    setBusy(true);
    setError(null);
    api
      .stravaAuthorizeUrl("app")
      .then(({ url }) =>
        WebBrowser.openAuthSessionAsync(url, makeRedirectUri({ path: "connected/strava" }))
      )
      .then((result) => {
        setBusy(false);
        if (result.type === "success") onConnected();
      })
      .catch((err: unknown) => {
        setBusy(false);
        setError(err instanceof Error ? err.message : t("settings.stravaUnreachable"));
      });
  }, [api, onConnected]);

  return { connect, busy, error };
}
