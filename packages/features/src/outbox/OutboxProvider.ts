import { focusManager, onlineManager, useQueryClient } from "@tanstack/react-query";
import React from "react";
import { attachOutbox } from "./held";
import type { Outbox } from "./outbox";

const OutboxContext = React.createContext<Outbox | null>(null);

/** Drains on mount, on reconnect and on every return to the foreground. */
export function OutboxProvider({
  outbox,
  children,
}: {
  outbox: Outbox;
  children: React.ReactNode;
}): React.ReactElement {
  const client = useQueryClient();
  React.useEffect(() => {
    const detach = attachOutbox(client, outbox);
    const drainWhen = (ready: boolean): void => {
      if (ready) void outbox.drain();
    };
    const offOnline = onlineManager.subscribe(drainWhen);
    const offFocus = focusManager.subscribe(drainWhen);
    drainWhen(true);
    return () => {
      detach();
      offOnline();
      offFocus();
    };
  }, [client, outbox]);
  return React.createElement(OutboxContext.Provider, { value: outbox }, children);
}

export function useOutbox(): Outbox {
  const outbox = React.useContext(OutboxContext);
  if (outbox === null) throw new Error("useOutbox needs an OutboxProvider");
  return outbox;
}
