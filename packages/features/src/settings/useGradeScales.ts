import React from "react";
import type { GradeScales, SendtallyApi } from "@sendtally/api-client";
import { t } from "../i18n";
import { queries, useQuery } from "../query";
import { DEFAULT_GRADE_SCALES } from "./transforms";
import type { SettingsVM } from "./types";

export type GradeScalesFeature = {
  scales: GradeScales;
  busy: boolean;
  error: string | null;
  set: (scales: Partial<GradeScales>) => void;
};

export function useGradeScales(
  api: SendtallyApi,
  vm: SettingsVM,
  onSaved: () => void
): GradeScalesFeature {
  // The status query resolves after the first render, so the server's values
  // are the source and an unsaved choice is layered over them.
  const [pending, setPending] = React.useState<Partial<GradeScales>>({});
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const set = React.useCallback(
    (next: Partial<GradeScales>) => {
      setPending((current) => ({ ...current, ...next }));
      setBusy(true);
      setError(null);
      api
        .setGradeScales(next)
        .then(() => {
          setBusy(false);
          onSaved();
        })
        .catch((err: unknown) => {
          setBusy(false);
          setError(err instanceof Error ? err.message : t("common.somethingWentWrong"));
        });
    },
    [api, onSaved]
  );

  return { scales: { ...vm.gradeScales, ...pending }, busy, error, set };
}

// Read-only counterpart for the screens that only need to know which scale to
// show: the project dialog and a new session draft.
export function useGradeScalePrefs(api: SendtallyApi): { scales: GradeScales; ready: boolean } {
  const { state } = useQuery(queries.status(api));
  return {
    scales: (state.status === "ready" ? state.data.gradeScales : null) ?? DEFAULT_GRADE_SCALES,
    ready: state.status !== "loading",
  };
}
