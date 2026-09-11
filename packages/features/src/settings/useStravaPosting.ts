import React from "react";
import type { SendtallyApi } from "@sendtally/api-client";
import type { SettingsVM } from "./types";

export type StravaPostingFeature = {
  enabled: boolean;
  since: string;
  busy: boolean;
  error: string | null;
  setEnabled: (value: boolean) => void;
  setSince: (value: string) => void;
};

export function useStravaPosting(
  api: SendtallyApi,
  vm: SettingsVM,
  onSaved: () => void
): StravaPostingFeature {
  const [enabled, setEnabledLocal] = React.useState(vm.postingEnabled);
  const [since, setSinceLocal] = React.useState(vm.postSince);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // The status query resolves after the first render, so adopt its values once,
  // and leave anything the user has since changed alone.
  const [adopted, setAdopted] = React.useState(false);
  if (!adopted && vm.stravaConnected) {
    setAdopted(true);
    setEnabledLocal(vm.postingEnabled);
    setSinceLocal(vm.postSince);
  }

  const save = React.useCallback(
    (nextEnabled: boolean, nextSince: string) => {
      setBusy(true);
      setError(null);
      api
        .setStravaPosting(nextEnabled, nextSince === "" ? null : nextSince)
        .then(() => {
          setBusy(false);
          onSaved();
        })
        .catch((err: unknown) => {
          setBusy(false);
          setError(err instanceof Error ? err.message : "Something went wrong.");
        });
    },
    [api, onSaved]
  );

  const setEnabled = React.useCallback(
    (value: boolean) => {
      setEnabledLocal(value);
      save(value, since);
    },
    [save, since]
  );

  const setSince = React.useCallback(
    (value: string) => {
      setSinceLocal(value);
      // A half-typed date is not worth a request; only whole dates or a cleared
      // field reach the API.
      if (value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value)) save(enabled, value);
    },
    [save, enabled]
  );

  return { enabled, since, busy, error, setEnabled, setSince };
}
