import React from "react";
import type { LinksFunction, LoaderFunctionArgs } from "react-router";
import { Link, useLoaderData, useSearchParams } from "react-router";
import type { ConnectionStatus, SessionRow } from "@sendtally/api-client";
import { countLabel, sessionYearGroups } from "@sendtally/features/sessions";
import { requireApi } from "../lib/api.server";
import { monthAnchorId } from "../sessions/anchors";
import { LogSessionFab } from "../sessions/components/LogSessionFab";
import { MonthJumpRail } from "../sessions/components/MonthJumpRail";
import { MonthScopeBar } from "../sessions/components/MonthScopeBar";
import { SessionYearGroup } from "../sessions/components/SessionYearGroup";
import sessionsStyles from "../sessions/sessions.css?url";
import { useVisibleMonth } from "../sessions/useVisibleMonth";

type LoaderData = {
  status: ConnectionStatus;
  sessions: SessionRow[];
};

export const links: LinksFunction = () => [{ rel: "stylesheet", href: sessionsStyles }];

export async function loader(args: LoaderFunctionArgs): Promise<LoaderData> {
  const api = await requireApi(args);
  const status = await api.status();
  const { sessions } = await api.sessions();
  return { status, sessions };
}

export default function Sessions(): React.ReactElement {
  const { status, sessions } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const stravaConnected = status.strava?.status === "active";
  const years = React.useMemo(() => sessionYearGroups(sessions), [sessions]);
  const monthKeys = React.useMemo(() => years.flatMap((y) => y.months.map((m) => m.key)), [years]);
  const currentKey = useVisibleMonth(monthKeys);
  const requestedMonth = searchParams.get("month");

  React.useEffect(() => {
    if (requestedMonth === null) return;
    document.getElementById(monthAnchorId(requestedMonth))?.scrollIntoView({ block: "start" });
  }, [requestedMonth]);

  return (
    <div>
      <div className="sessions-head">
        <h1
          style={{
            margin: 0,
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 32,
            letterSpacing: "-0.03em",
          }}
        >
          Sessions
        </h1>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontWeight: 500,
            fontSize: 11,
            color: "rgba(64,63,76,0.55)",
            letterSpacing: "0.06em",
          }}
        >
          {countLabel(sessions.length)}
        </span>
        <div style={{ flex: 1 }} />
        <Link
          to="/app/sessions/new"
          className="sessions-head-action"
          style={{
            fontFamily: "var(--font-sans)",
            fontWeight: 600,
            fontSize: 13,
            color: "var(--bs-white)",
            background: "var(--bs-azure-ink)",
            borderRadius: "var(--radius-control)",
            padding: "9px 16px",
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
        >
          Log a session
        </Link>
      </div>
      {!stravaConnected && (
        <div className="sessions-banner">
          <span style={{ flex: 1, fontSize: 14, lineHeight: 1.5, color: "var(--text-on-light)" }}>
            Your logbook lives here either way. Connect Strava and your sessions can post to your
            feed as Rock Climbing activities.
          </span>
          <Link
            to="/app/setup"
            style={{
              fontFamily: "var(--font-sans)",
              fontWeight: 600,
              fontSize: 13,
              color: "var(--bs-white)",
              background: "var(--bs-azure-ink)",
              borderRadius: "var(--radius-control)",
              padding: "9px 16px",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            Connect Strava
          </Link>
        </div>
      )}
      {years.length > 0 && (
        <>
          <MonthScopeBar years={years} currentKey={currentKey} />
          <div className="sessions-body">
            <div className="sessions-list">
              {years.map((year) => (
                <SessionYearGroup key={year.year} year={year} />
              ))}
            </div>
            <MonthJumpRail years={years} currentKey={currentKey} />
          </div>
        </>
      )}
      {sessions.length === 0 && (
        <div
          style={{
            padding: 36,
            textAlign: "center",
            fontFamily: "var(--font-mono)",
            fontSize: 13,
            color: "rgba(64,63,76,0.55)",
          }}
        >
          No sessions yet. Hit Log a session and your first one takes about a minute.
        </div>
      )}
      <LogSessionFab />
    </div>
  );
}
