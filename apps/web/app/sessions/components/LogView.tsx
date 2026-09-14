import React from "react";
import { Link, useSearchParams } from "react-router";
import type { ConnectionStatus, JournalEntry, SessionRow } from "@sendtally/api-client";
import { Logo } from "@sendtally/design";
import { t } from "@sendtally/features/i18n";
import { logItems, today } from "@sendtally/features/journal";
import {
  filterSessionsByTags,
  logYearGroups,
  monthScopeItems,
  sessionTagGroups,
  sessionTagOptions,
  logCountLabel,
  tagScopeItems,
  type SessionGrouping,
} from "@sendtally/features/sessions";
import { sectionAnchorId } from "../anchors";
import { DraftSessionRow } from "./DraftSessionRow";
import { LogSessionFab } from "./LogSessionFab";
import { MonthJumpRail } from "./MonthJumpRail";
import { ScopeBar } from "./ScopeBar";
import { SessionFilters } from "./SessionFilters";
import { SessionFilterSheet } from "./SessionFilterSheet";
import { SessionTagSection } from "./SessionTagSection";
import { SessionYearGroup } from "./SessionYearGroup";
import { StravaSetupRow } from "./StravaSetupRow";
import { useVisibleSection } from "../useVisibleSection";

/** Which half of the log is on show. "journal" is what /app/journal is. */
export type LogScope = "all" | "sessions" | "journal";

const SCOPES: Array<{ value: LogScope; label: () => string }> = [
  { value: "all", label: () => t("journal.showEverything") },
  { value: "sessions", label: () => t("journal.showSessions") },
  { value: "journal", label: () => t("journal.showJournal") },
];

const muted: React.CSSProperties = {
  padding: 36,
  textAlign: "center",
  fontFamily: "var(--font-mono)",
  fontSize: 13,
  color: "rgba(64,63,76,0.55)",
};

export function LogView({
  status,
  sessions,
  entries,
  scope,
  basePath,
}: {
  status: ConnectionStatus;
  sessions: SessionRow[];
  entries: JournalEntry[];
  scope: LogScope;
  basePath: string;
}): React.ReactElement {
  const [searchParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const stravaConnected = status.strava?.status === "active";
  const stravaLapsed = status.strava !== null && !stravaConnected;

  const grouping: SessionGrouping = searchParams.get("group") === "tag" ? "tag" : "month";
  const selectedTags = searchParams.getAll("tag");

  const all = React.useMemo(() => logItems(sessions, entries), [sessions, entries]);
  const inScope = React.useMemo(() => {
    if (scope === "sessions") return all.filter((i) => i.type === "session");
    if (scope === "journal") return all.filter((i) => i.type === "entry");
    // A note written about a session is read on that session: showing both puts
    // the same night in the list twice, one row above the other. Trips and
    // injuries are their own thing and stay in the log whatever they link.
    return all.filter(
      (i) => i.type === "session" || i.entry.kind !== "journal" || i.entry.fingerprints.length === 0
    );
  }, [all, scope]);

  const tagOptions = React.useMemo(() => sessionTagOptions(inScope), [inScope]);
  const untaggedCount = React.useMemo(
    () => inScope.filter((i) => i.tags.length === 0).length,
    [inScope]
  );
  const visible = React.useMemo(
    () => filterSessionsByTags(inScope, selectedTags),
    [inScope, selectedTags]
  );

  const years = React.useMemo(() => logYearGroups(visible), [visible]);
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
      return query === "" ? basePath : `${basePath}?${query}`;
    },
    [basePath, grouping, selectedTags]
  );

  const countText = logCountLabel(visible);

  return (
    <div>
      <div className="sessions-head">
        <span className="sessions-head-mark">
          <Logo variant="mark" size={22} />
        </span>
        <h1 className="sessions-title">{t("journal.log")}</h1>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontWeight: 500,
            fontSize: 11,
            color: "rgba(64,63,76,0.55)",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          {countText}
        </span>
        <div style={{ flex: 1 }} />
        <Link
          to={`/app/journal/new?date=${today()}`}
          className="sessions-head-action sessions-ghost-link"
        >
          {t("journal.writeAnEntry")}
        </Link>
        {sessions.length > 0 && (
          <Link to="/app/sessions/new" className="sessions-head-action sessions-primary-link">
            {t("common.logASession")}
          </Link>
        )}
      </div>
      {!stravaConnected && <StravaSetupRow lapsed={stravaLapsed} />}
      <DraftSessionRow />
      <div className="sessions-filters">
        <div className="sessions-filter-row">
          <span className="sessions-filter-label">{t("journal.show")}</span>
          {SCOPES.map(({ value, label }) => (
            <Link
              key={value}
              to={
                value === "journal"
                  ? "/app/journal"
                  : value === "all"
                    ? "/app"
                    : "/app?show=sessions"
              }
              aria-current={scope === value ? "page" : undefined}
              className={scope === value ? "sessions-scope-chip is-on" : "sessions-scope-chip"}
            >
              {label()}
            </Link>
          ))}
        </div>
      </div>
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
      {inScope.length === 0 && scope === "journal" && (
        <div className="sessions-first">
          <span className="sessions-first-label">{t("journal.emptyTitle")}</span>
          <p className="sessions-first-body">{t("journal.emptyBody")}</p>
          <Link to={`/app/journal/new?date=${today()}`} className="sessions-primary-link">
            {t("journal.writeAnEntry")}
          </Link>
        </div>
      )}
      {inScope.length === 0 && scope !== "journal" && (
        <div className="sessions-first">
          <span className="sessions-first-label">{t("sessions.firstSessionLabel")}</span>
          <p className="sessions-first-body">{t("sessions.firstSessionBody")}</p>
          <Link to="/app/sessions/new" className="sessions-primary-link">
            {t("common.logASession")}
          </Link>
        </div>
      )}
      {inScope.length > 0 && visible.length === 0 && (
        <div style={muted}>
          {t("sessions.noneForTags")}{" "}
          <Link to={hrefFor({ tags: [] })} style={{ color: "var(--bs-azure-ink)" }}>
            {t("sessions.clearFilter")}
          </Link>
        </div>
      )}
      <LogSessionFab />
      {filtersOpen && (
        <SessionFilterSheet
          onClose={() => setFiltersOpen(false)}
          items={inScope}
          grouping={grouping}
          tagOptions={tagOptions}
          untaggedCount={untaggedCount}
          selectedTags={selectedTags}
          hrefFor={hrefFor}
        />
      )}
    </div>
  );
}
