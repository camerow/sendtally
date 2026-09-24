import React from "react";

export type IconName =
  | "sessions"
  | "projects"
  | "trends"
  | "settings"
  | "membership"
  | "funnel"
  | "plus"
  | "chevron"
  | "trash"
  | "lock"
  | "endurance"
  | "x"
  | "more"
  | "moderation";

const SHAPES: Record<IconName, React.ReactElement> = {
  sessions: (
    <>
      <rect x="3.5" y="5" width="17" height="6" rx="2" />
      <rect x="3.5" y="13" width="17" height="6" rx="2" />
    </>
  ),
  projects: <path d="M6 20.5V4h11.5l-3 4.5 3 4.5H6" />,
  trends: <path d="M4 16.8 9.2 10.4 13.2 13.6 20 5.8" />,
  settings: (
    <>
      <path d="M4 8h7.4M16.6 8H20M4 16h3.4M12.6 16H20" />
      <circle cx="14" cy="8" r="2.4" />
      <circle cx="10" cy="16" r="2.4" />
    </>
  ),
  membership: <path d="M12 3.9l2.5 5.1 5.6.8-4.1 4 1 5.6-5-2.7-5 2.7 1-5.6-4.1-4 5.6-.8z" />,
  funnel: <path d="M4 5h16l-6.2 7.2V18.5l-3.6 1.8v-8.1z" />,
  plus: <path d="M12 5v14M5 12h14" />,
  chevron: <path d="M9.5 5.5 16 12l-6.5 6.5" />,
  lock: (
    <>
      <rect x="5" y="11" width="14" height="9.5" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </>
  ),
  trash: <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />,
  endurance: (
    <path d="M2 9c2.5-3 5-3 7.5 0S15 12 17.5 9 21 6 22 7M2 17c2.5-3 5-3 7.5 0s5 3 7.5 0 3.5-3 4.5-2" />
  ),
  x: <path d="M6 6l12 12M18 6L6 18" />,
  more: <path d="M5 12h.01M12 12h.01M19 12h.01" />,
  moderation: <path d="M12 3.5 19 6.2v5.3c0 4.3-2.9 7.6-7 9-4.1-1.4-7-4.7-7-9V6.2z" />,
};

export function Icon({
  name,
  size = 20,
  strokeWidth = 1.7,
}: {
  name: IconName;
  size?: number;
  strokeWidth?: number;
}): React.ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flex: "none" }}
    >
      {SHAPES[name]}
    </svg>
  );
}
