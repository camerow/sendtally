import React from "react";
import type { GradeScales, SendtallyApi } from "@sendtally/api-client";
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
  const [scales, setLocal] = React.useState<GradeScales>(vm.gradeScales);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // The status query resolves after the first render, so adopt its values until
  // the user has changed something.
  const loaded = React.useRef(false);
  React.useEffect(() => {
    if (loaded.current) return;
    if (!vm.ready) return;
    loaded.current = true;
    setLocal(vm.gradeScales);
  }, [vm.ready, vm.gradeScales]);

  const set = React.useCallback(
    (next: Partial<GradeScales>) => {
      loaded.current = true;
      setLocal((current) => ({ ...current, ...next }));
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
          setError(err instanceof Error ? err.message : "Something went wrong.");
        });
    },
    [api, onSaved]
  );

  return { scales, busy, error, set };
}

// Read-only counterpart for the screens that only need to know which scale to
// show: the project dialog and a new session draft.
export function useGradeScalePrefs(api: SendtallyApi): { scales: GradeScales; ready: boolean } {
  const [scales, setScales] = React.useState<GradeScales>(DEFAULT_GRADE_SCALES);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    let live = true;
    api
      .status()
      .then((status) => {
        if (!live) return;
        setScales(status.gradeScales ?? DEFAULT_GRADE_SCALES);
        setReady(true);
      })
      .catch(() => {
        if (live) setReady(true);
      });
    return () => {
      live = false;
    };
  }, [api]);

  return { scales, ready };
}
