import { useQueryClient } from "@tanstack/react-query";
import React from "react";
import { resetPlanPath } from "../onboarding/planPath";

/** A cache is one person's log: signing out, or in as someone else, drops it and the wizard's walk. */
export function useClearOnUserChange(ready: boolean, userId: string | null | undefined): void {
  const client = useQueryClient();
  const owner = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (!ready) return;
    if (!userId || (owner.current !== null && owner.current !== userId)) {
      client.clear();
      resetPlanPath();
    }
    owner.current = userId ?? null;
  }, [client, ready, userId]);
}
