import * as Updates from "expo-updates";
import React from "react";
import { restartIntoUpdate } from "./restartIntoUpdate";

export type UpdateRestart = {
  pendingUpdateId: string | null;
  restarting: boolean;
  restart: () => void;
};

/** A downloaded update waiting for a restart, and the restart itself. */
export function useUpdateRestart(): UpdateRestart {
  const { isUpdatePending, downloadedUpdate } = Updates.useUpdates();
  const [restarting, setRestarting] = React.useState(false);
  const restart = React.useCallback(() => {
    setRestarting(true);
    restartIntoUpdate().catch(() => setRestarting(false));
  }, []);
  return {
    pendingUpdateId: isUpdatePending ? (downloadedUpdate?.updateId ?? null) : null,
    restarting,
    restart,
  };
}
