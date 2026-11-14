import React from "react";
import { Button } from "@sendtally/design";
import { AGENTS } from "../agentsCopy";

/** The connector URL with a ghost Copy button, for anyone who knows what to do with it. */
export function CopyUrl({ url }: { url: string }): React.ReactElement {
  const [copied, setCopied] = React.useState(false);
  const copyUrl = async (): Promise<void> => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
  };
  return (
    <div className="l-url">
      <code className="l-code">{url}</code>
      <Button variant="ghostOnLight" size="sm" onClick={() => void copyUrl()}>
        {copied ? AGENTS.copied : AGENTS.copy}
      </Button>
    </div>
  );
}
