import React from "react";
import type { EntryKind } from "@sendtally/features/journal";

const PATHS: Record<EntryKind, React.ReactElement> = {
  journal: (
    <>
      <path d="M4.4 3.6h8.2l3 3v9.8H4.4z" />
      <path d="M7.1 8.2h5.8M7.1 11h5.8M7.1 13.8h3.2" />
    </>
  ),
  trip: (
    <>
      <path d="M10 17.4s5.1-4.6 5.1-8.3a5.1 5.1 0 0 0-10.2 0c0 3.7 5.1 8.3 5.1 8.3z" />
      <circle cx="10" cy="9.1" r="1.9" />
    </>
  ),
  injury: (
    <>
      <rect x="2.4" y="7.2" width="15.2" height="5.6" rx="2.8" transform="rotate(-45 10 10)" />
      <path d="M8.7 10h0M10 8.7h0M10 11.3h0M11.3 10h0" />
    </>
  ),
};

export function EntryKindIcon({
  kind,
  size = 20,
}: {
  kind: EntryKind;
  size?: number;
}): React.ReactElement {
  return (
    <svg
      viewBox="0 0 20 20"
      width={size}
      height={size}
      aria-hidden
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flex: "none" }}
    >
      {PATHS[kind]}
    </svg>
  );
}
