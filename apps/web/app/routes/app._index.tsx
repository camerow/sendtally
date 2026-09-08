import React from "react";
import type { LoaderFunctionArgs } from "react-router";
import { Link, useLoaderData, useSearchParams } from "react-router";
import type { ConnectionStatus, SessionRow } from "@sendtally/api-client";
import {
  filterSessionsByTags,
  resolveSessionMonth,
  sessionBadge,
  sessionMonths,
  sessionTagGroups,
  sessionTagOptions,
  sessionTitle,
  type SessionGrouping,
} from "@sendtally/features/sessions";
import { requireApi } from "../lib/api.server";
import { MonthPicker } from "../sessions/components/MonthPicker";
import { SessionFilters } from "../sessions/components/SessionFilters";
import { SessionRowItem } from "../sessions/components/SessionRowItem";

type LoaderData = {
  status: ConnectionStatus;
  sessions: SessionRow[];
};

export async function loader(args: LoaderFunctionArgs): Promise<LoaderData> {
  const api = await requireApi(args);
  const status = await api.status();
  const { sessions } = await api.sessions();
  return { status, sessions };
}

const bannerButton: React.CSSProperties = {
  fontFamily: "var(--font-sans)",
  fontWeight: 600,
  fontSize: 13,
  color: "var(--bs-white)",
  background: "var(--bs-azure-ink)",
  border: "none",
  borderRadius: "var(--radius-control)",
  padding: "9px 16px",
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const groupHeading: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontWeight: 500,
  fontSize: 11,
  letterSpacing: "0.08em",
  color: "var(--text-label-accent)",
};

const muted: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 13,
  color: "rgba(64,63,76,0.55)",
};

function SessionList({ sessions }: { sessions: SessionRow[] }): React.ReactElement {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {sessions.map((s) => (
        <SessionRowItem
          key={s.fingerprint}
          session={s}
          title={sessionTitle(s)}
          badge={sessionBadge(s)}
        />
      ))}
    </div>
  );
}

export default function Sessions(): React.ReactElement {
  const { status, sessions } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const stravaConnected = status.strava?.status === "active";

  const grouping: SessionGrouping = searchParams.get("group") === "tag" ? "tag" : "month";
  const selectedTags = searchParams.getAll("tag");

  const tagOptions = React.useMemo(() => sessionTagOptions(sessions), [sessions]);
  const untaggedCount = React.useMemo(
    () => sessions.filter((s) => s.tags.length === 0).length,
    [sessions]
  );
  const visible = React.useMemo(
    () => filterSessionsByTags(sessions, selectedTags),
    [sessions, selectedTags]
  );

  const months = React.useMemo(() => sessionMonths(visible), [visible]);
  const selectedMonth = resolveSessionMonth(months, searchParams.get("month"));
  const tagGroups = React.useMemo(() => sessionTagGroups(visible), [visible]);

  const hrefFor = React.useCallback(
    (next: { grouping?: SessionGrouping; tags?: string[] }): string => {
      const params = new URLSearchParams();
      const group = next.grouping ?? grouping;
      if (group === "tag") params.set("group", "tag");
      for (const slug of next.tags ?? selectedTags) params.append("tag", slug);
      const query = params.toString();
      return query === "" ? "/app" : `/app?${query}`;
    },
    [grouping, selectedTags]
  );

  const monthHref = React.useCallback(
    (key: string): string => {
      const params = new URLSearchParams();
      for (const slug of selectedTags) params.append("tag", slug);
      params.set("month", key);
      return `/app?${params.toString()}`;
    },
    [selectedTags]
  );

  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 16, flexWrap: "wrap" }}>
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
          {visible.length === 1 ? "1 SESSION" : `${visible.length} SESSIONS`}
        </span>
        <div style={{ flex: 1 }} />
        <Link
          to="/app/sessions/new"
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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            background: "var(--surface-accent-pink)",
            borderRadius: "var(--radius-card)",
            padding: "16px 20px",
            marginTop: 22,
          }}
        >
          <span style={{ flex: 1, fontSize: 14, lineHeight: 1.5, color: "var(--text-on-light)" }}>
            Your logbook lives here either way. Connect Strava and your sessions can post to your
            feed as Rock Climbing activities.
          </span>
          <Link to="/app/setup" style={{ ...bannerButton, textDecoration: "none" }}>
            Connect Strava
          </Link>
        </div>
      )}
      {tagOptions.length > 0 && (
        <SessionFilters
          grouping={grouping}
          tagOptions={tagOptions}
          untaggedCount={untaggedCount}
          selectedTags={selectedTags}
          hrefFor={hrefFor}
        />
      )}
      {grouping === "month" && selectedMonth !== null && (
        <>
          <div style={{ marginTop: 26 }}>
            <MonthPicker months={months} selected={selectedMonth} hrefFor={monthHref} />
          </div>
          <div style={{ marginTop: 18 }}>
            <SessionList sessions={selectedMonth.sessions} />
          </div>
        </>
      )}
      {grouping === "tag" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 26, marginTop: 26 }}>
          {tagGroups.map((group) => (
            <section key={group.key} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <span style={groupHeading}>
                {group.label.toUpperCase()} ·{" "}
                {group.sessions.length === 1 ? "1 SESSION" : `${group.sessions.length} SESSIONS`}
              </span>
              <SessionList sessions={group.sessions} />
            </section>
          ))}
        </div>
      )}
      {sessions.length === 0 && (
        <div style={{ ...muted, padding: 36, textAlign: "center" }}>
          No sessions yet. Hit Log a session and your first one takes about a minute.
        </div>
      )}
      {sessions.length > 0 && visible.length === 0 && (
        <div style={{ ...muted, padding: 36, textAlign: "center" }}>
          No sessions carry those tags.{" "}
          <Link to={hrefFor({ tags: [] })} style={{ color: "var(--bs-azure-ink)" }}>
            Clear the filter
          </Link>
        </div>
      )}
    </div>
  );
}
