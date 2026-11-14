import React from "react";

export function useCopy(text: string): { copied: boolean; copy: () => void } {
  const [copied, setCopied] = React.useState(false);
  const copy = (): void => {
    void navigator.clipboard.writeText(text).then(() => setCopied(true));
  };
  return { copied, copy };
}
