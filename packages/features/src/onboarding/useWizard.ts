import { useQuery, useQueryClient } from "@tanstack/react-query";
import React from "react";
import type { FirstRunStep, SendtallyApi } from "@sendtally/api-client";
import { queries } from "../query";
import type { Wizard } from "./types";
import {
  announceOpen,
  NO_PROGRESS,
  openWizard,
  patchStatus,
  wizardOf,
  type WizardOptions,
} from "./wizardState";

/** The onboarding wizard, the same on both apps: each app draws `step` and routes after `complete`, `skip` and `leave`. */
export function useWizard(api: SendtallyApi, { capture, start }: WizardOptions): Wizard {
  const client = useQueryClient();
  const { data } = useQuery(queries.status(api));
  const onboarding = data?.onboarding;
  // ponytail: opens on NO_PROGRESS when the status is not cached yet; the gate only opens the wizard once it is.
  const progress = onboarding?.progress ?? NO_PROGRESS;
  const [state, update] = React.useState(() => openWizard(onboarding, { progress }, start));

  const send = React.useCallback(
    (to: FirstRunStep): void => {
      client.setQueryData(
        queries.status(api).queryKey,
        (status) => status && patchStatus(status, to)
      );
      void api.firstRunStep(to).catch(() => undefined);
    },
    [api, client]
  );

  const announced = React.useRef(false);
  React.useEffect(() => {
    if (announced.current) return;
    announced.current = true;
    announceOpen(state, onboarding, start, { send, capture });
  });

  return wizardOf(state, { progress, capture, send, update });
}
