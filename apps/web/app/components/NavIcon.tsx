import React from "react";

export type NavIconName = "sessions" | "trends" | "settings" | "membership";

const SHAPES: Record<NavIconName, React.ReactElement> = {
  sessions: (
    <>
      <rect x="3.5" y="5" width="17" height="6" rx="2" />
      <rect x="3.5" y="13" width="17" height="6" rx="2" />
    </>
  ),
  trends: <path d="M4 16.8 9.2 10.4 13.2 13.6 20 5.8" />,
  settings: (
    <>
      <path d="M4 8h7.4M16.6 8H20M4 16h3.4M12.6 16H20" />
      <circle cx="14" cy="8" r="2.4" />
      <circle cx="10" cy="16" r="2.4" />
    </>
  ),
  membership: <path d="M12 3.9l2.5 5.1 5.6.8-4.1 4 1 5.6-5-2.7-5 2.7 1-5.6-4.1-4 5.6-.8z" />,
};

export function NavIcon({
  name,
  size = 20,
}: {
  name: NavIconName;
  size?: number;
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
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flex: "none" }}
    >
      {SHAPES[name]}
    </svg>
  );
}
