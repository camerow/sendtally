import React from "react";
import { Link } from "react-router";

export function LogSessionFab(): React.ReactElement {
  return (
    <Link to="/app/sessions/new" className="sessions-fab">
      <svg
        viewBox="0 0 16 16"
        width={17}
        height={17}
        aria-hidden
        focusable="false"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        style={{ flex: "none" }}
      >
        <path d="M8 3.6V12.4M3.6 8H12.4" />
      </svg>
      Log a session
    </Link>
  );
}
