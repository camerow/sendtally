import React from "react";
import type { LinksFunction, LoaderFunctionArgs } from "react-router";
import { Link, useLoaderData, useSearchParams } from "react-router";
import type { ConnectionStatus, SessionRow } from "@sendtally/api-client";
import { Logo } from "@sendtally/design";
import {
  countLabel,
  filterSessionsByTags,
  monthScopeItems,
  sessionTagGroups,
  sessionTagOptions,
  sessionYearGroups,
  tagScopeItems,
  type SessionGrouping,
} from "@sendtally/features/sessions";
import { requireApi } from "../lib/api.server";
import { sectionAnchorId } from "../sessions/anchors";
import { LogSessionFab } from "../sessions/components/LogSessionFab";
import { MonthJumpRail } from "../sessions/components/MonthJumpRail";
import { ScopeBar } from "../sessions/components/ScopeBar";
import { SessionFilters } from "../sessions/components/SessionFilters";
import { SessionFilterSheet } from "../sessions/components/SessionFilterSheet";
import { SessionTagSection } from "../sessions/components/SessionTagSection";
import { SessionYearGroup } from "../sessions/components/SessionYearGroup";
import sessionsStyles from "../sessions/sessions.css?url";
import { useVisibleSection } from "../sessions/useVisibleSection";

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

const muted: React.CSSProperties = {
  padding: 36,
  textAlign: "center",
  fontFamily: "var(--font-mono)",
  fontSize: 13,
  color: "rgba(64,63,76,0.55)",
};

export default function Sessions(): React.ReactElement {
  const { status, sessions } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = React.useState(false);
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

  const years = React.useMemo(() => sessionYearGroups(visible), [visible]);
  const tagGroups = React.useMemo(() => sessionTagGroups(visible), [visible]);
  const scopeItems = React.useMemo(
    () => (grouping === "tag" ? tagScopeItems(tagGroups) : monthScopeItems(years)),
    [grouping, tagGroups, years]
  );
  const sectionKeys = React.useMemo(
    () =>
      grouping === "tag"
        ? tagGroups.map((g) => g.key)
        : years.flatMap((y) => y.months.map((m) => m.key)),
    [grouping, tagGroups, years]
  );
  const currentKey = useVisibleSection(sectionKeys);
  const requestedMonth = searchParams.get("month");

  React.useEffect(() => {
    if (requestedMonth === null) return;
    document.getElementById(sectionAnchorId(requestedMonth))?.scrollIntoView({ block: "start" });
  }, [requestedMonth]);

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

  return (
    <div>
      <div className="sessions-head">
        <span className="sessions-head-mark">
          <Logo variant="mark" size={22} />
        </span>
        <h1 className="sessions-title">Sessions</h1>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontWeight: 500,
            fontSize: 11,
            color: "rgba(64,63,76,0.55)",
            letterSpacing: "0.06em",
          }}
        >
          {countLabel(visible.length)}
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
          <span style={{ flex: 1, fontSize: 14, lineHeight: 1.5, color: "var(--text-on-dark)" }}>
            Your logbook lives here either way. Connect Strava and your sessions can post to your
            feed as Rock Climbing activities.
          </span>
          <Link
            to="/app/setup"
            style={{
              fontFamily: "var(--font-sans)",
              fontWeight: 600,
              fontSize: 13,
              color: "var(--bs-gunmetal)",
              background: "var(--bs-gold)",
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
      {tagOptions.length > 0 && (
        <SessionFilters
          grouping={grouping}
          tagOptions={tagOptions}
          untaggedCount={untaggedCount}
          selectedTags={selectedTags}
          hrefFor={hrefFor}
        />
      )}
      {scopeItems.length > 0 && (
        <ScopeBar
          items={scopeItems}
          currentKey={currentKey}
          filtersActive={selectedTags.length > 0 || grouping === "tag"}
          onOpenFilters={() => setFiltersOpen(true)}
        />
      )}
      {grouping === "month" && years.length > 0 && (
        <div className="sessions-body">
          <div className="sessions-list">
            {years.map((year) => (
              <SessionYearGroup key={year.year} year={year} />
            ))}
          </div>
          <MonthJumpRail years={years} currentKey={currentKey} />
        </div>
      )}
      {grouping === "tag" && tagGroups.length > 0 && (
        <div className="sessions-body">
          <div className="sessions-list">
            {tagGroups.map((group) => (
              <SessionTagSection key={group.key} group={group} />
            ))}
          </div>
        </div>
      )}
      {sessions.length === 0 && (
        <div style={muted}>
          No sessions yet. Hit Log a session and your first one takes about a minute.
        </div>
      )}
      {sessions.length > 0 && visible.length === 0 && (
        <div style={muted}>
          No sessions carry those tags.{" "}
          <Link to={hrefFor({ tags: [] })} style={{ color: "var(--bs-azure-ink)" }}>
            Clear the filter
          </Link>
        </div>
      )}
      <LogSessionFab />
      <SessionFilterSheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        sessions={sessions}
        grouping={grouping}
        tagOptions={tagOptions}
        untaggedCount={untaggedCount}
        selectedTags={selectedTags}
        hrefFor={hrefFor}
      />
    </div>
  );
}
