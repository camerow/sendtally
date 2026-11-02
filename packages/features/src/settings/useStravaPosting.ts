import React from "react";
import type { SendtallyApi } from "@sendtally/api-client";
import { t } from "../i18n";
import type { SettingsVM } from "./types";

export type StravaPostingFeature = {
  enabled: boolean;
  since: string;
  /** Whether training other than climbing and hangboarding posts on its own. */
  training: boolean;
  busy: boolean;
  error: string | null;
  setEnabled: (value: boolean) => void;
  setSince: (value: string) => void;
  setTraining: (value: boolean) => void;
};

export function useStravaPosting(
  api: SendtallyApi,
  vm: SettingsVM,
  onSaved: () => void
): StravaPostingFeature {
  const [enabled, setEnabledLocal] = React.useState(vm.postingEnabled);
  const [since, setSinceLocal] = React.useState(vm.postSince);
  const [training, setTrainingLocal] = React.useState(vm.postTraining);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // The status query resolves after the first render, so adopt its values once,
  // and leave anything the user has since changed alone.
  const [adopted, setAdopted] = React.useState(false);
  if (!adopted && vm.stravaConnected) {
    setAdopted(true);
    setEnabledLocal(vm.postingEnabled);
    setSinceLocal(vm.postSince);
    setTrainingLocal(vm.postTraining);
  }

  const send = React.useCallback(
    (request: () => Promise<unknown>) => {
      setBusy(true);
      setError(null);
      request()
        .then(() => {
          setBusy(false);
          onSaved();
        })
        .catch((err: unknown) => {
          setBusy(false);
          setError(err instanceof Error ? err.message : t("common.somethingWentWrong"));
        });
    },
    [onSaved]
  );

  const save = React.useCallback(
    (nextEnabled: boolean, nextSince: string) =>
      send(() => api.setStravaPosting(nextEnabled, nextSince === "" ? null : nextSince)),
    [api, send]
  );

  const setTraining = React.useCallback(
    (value: boolean) => {
      setTrainingLocal(value);
      send(() => api.setTrainingPosting(value));
    },
    [api, send]
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

  return { enabled, since, training, busy, error, setEnabled, setSince, setTraining };
}
