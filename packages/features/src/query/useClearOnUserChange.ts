import { useQueryClient } from "@tanstack/react-query";
import React from "react";

/** A cache is one person's log: signing out, or in as someone else, drops it. */
export function useClearOnUserChange(ready: boolean, userId: string | null | undefined): void {
  const client = useQueryClient();
  const owner = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (!ready) return;
    if (!userId || (owner.current !== null && owner.current !== userId)) client.clear();
    owner.current = userId ?? null;
  }, [client, ready, userId]);
}
