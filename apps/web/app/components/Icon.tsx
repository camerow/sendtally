import React from "react";

export type IconName =
  | "today"
  | "hang"
  | "back"
  | "forward"
  | "sessions"
  | "projects"
  | "insights"
  | "membership"
  | "funnel"
  | "plus"
  | "chevron"
  | "trash"
  | "lock"
  | "endurance"
  | "x"
  | "more"
  | "moderation"
  | "search"
  | "climbs"
  | "import"
  | "external"
  | "train"
  | "star"
  | "stop"
  | "check"
  | "pencil"
  | "climb"
  | "up"
  | "down"
  | "restart"
  | "remove"
  | "play"
  | "pause";

const SHAPES: Record<IconName, React.ReactElement> = {
  today: (
    <path d="M5 6.5h14a1 1 0 0 1 1 1V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7.5a1 1 0 0 1 1-1zM4 10.5h16M8.5 4v4M15.5 4v4" />
  ),
  hang: (
    <>
      <path d="M4 5h16M8 5v4M12 5v6M16 5v8" />
      <circle cx={8} cy={11} r={2} />
      <circle cx={12} cy={13} r={2} />
      <circle cx={16} cy={15} r={2} />
    </>
  ),
  back: <path d="M15 5l-7 7 7 7" />,
  forward: <path d="M9 5l7 7-7 7" />,
  sessions: (
    <>
      <rect x="3.5" y="5" width="17" height="6" rx="2" />
      <rect x="3.5" y="13" width="17" height="6" rx="2" />
    </>
  ),
  projects: <path d="M6 20.5V4h11.5l-3 4.5 3 4.5H6" />,
  insights: <path d="M5 19V11M10 19V5M15 19v-6M20 19V8" />,
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
  search: <path d="M11 5a6 6 0 1 1 0 12 6 6 0 0 1 0-12zM20 20l-4.5-4.5" />,
  climbs: <path d="M3 19l6.5-11 4 6.5 2.5-3.5L21 19z" />,
  import: <path d="M12 4v10M7.5 9.5 12 14l4.5-4.5M4.5 15v4.5h15V15" />,
  external: <path d="M14 5h5v5M19 5l-8 8M17 14v5H5V7h5" />,
  up: <path d="M6 15l6-6 6 6" />,
  down: <path d="M6 9l6 6 6-6" />,
  restart: <path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3M4.5 4.5v4h4" />,
  remove: <path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0-18 0M8 12h8" />,
  star: <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" />,
  train: <path d="M3.5 5h17v5.5h-17zM7 7.75h3M14 7.75h3M9 10.5V20M15 10.5V20" />,
  climb: (
    <>
      <path d="M7 17 17 7" />
      <circle cx="7" cy="17" r="2.2" />
      <circle cx="12" cy="12" r="2.2" />
      <circle cx="17" cy="7" r="2.2" />
    </>
  ),
  stop: <rect x="7" y="7" width="10" height="10" rx="1.5" />,
  play: <path d="M8 5.5v13l10.5-6.5z" />,
  pause: <path d="M9 5.5v13M15 5.5v13" />,
  check: <path d="M5 12.5l4.5 4.5L19 7" />,
  pencil: <path d="M5 19h4L19 9l-4-4L5 15zM13.5 6.5l4 4" />,
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
