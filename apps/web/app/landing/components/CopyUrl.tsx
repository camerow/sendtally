import React from "react";
import { Button } from "@sendtally/design";
import { useCopy } from "../../lib/useCopy";
import { AGENTS } from "../agentsCopy";

/** The connector URL with a ghost Copy button, for anyone who knows what to do with it. */
export function CopyUrl({ url }: { url: string }): React.ReactElement {
  const { copied, copy } = useCopy(url);
  return (
    <div className="l-url">
      <code className="l-code">{url}</code>
      <Button variant="ghostOnLight" size="sm" onClick={copy}>
        {copied ? AGENTS.copied : AGENTS.copy}
      </Button>
    </div>
  );
}
