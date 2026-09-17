import React from "react";
import { Link, useSearchParams } from "react-router";
import type { ConnectionStatus, JournalEntry, SessionRow } from "@sendtally/api-client";
import { Logo } from "@sendtally/design";
import { t } from "@sendtally/features/i18n";
import {
  LOG_SCOPES,
  groupTrips,
  logItems,
  logScopeItems,
  logScopeLabel,
  today,
  type LogScope,
} from "@sendtally/features/journal";
import { useClimbVocabulary } from "@sendtally/features/climbs";
import { circuitGym, gymOfDraft, useGyms } from "@sendtally/features/gyms";
import { useLiveSession, withTries } from "@sendtally/features/log-session";
import { useGradeScalePrefs } from "@sendtally/features/settings";
import { useClientApi } from "../../lib/useClientApi";
import { sessionDraftStorage } from "../../lib/sessionDraftStorage";
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
import { LiveClimbEditor } from "./LiveClimbEditor";
import { LiveSessionCard } from "./LiveSessionCard";
import { LogMenu } from "./LogMenu";
import { MonthJumpRail } from "./MonthJumpRail";
import { ScopeBar } from "./ScopeBar";
import { SessionFilters } from "./SessionFilters";
import { SessionFilterSheet } from "./SessionFilterSheet";
import { SessionTagSection } from "./SessionTagSection";
import { SessionYearGroup } from "./SessionYearGroup";
import { SetupStack, type SetupCard } from "./SetupStack";
import { useDismissed } from "../../lib/useDismissed";
import { useVisibleSection } from "../useVisibleSection";

const muted: React.CSSProperties = {
  padding: 36,
  textAlign: "center",
  fontFamily: "var(--font-mono)",
  fontSize: 13,
  color: "rgba(64,63,76,0.55)",
};

export function LogView({
  apiUrl,
  status,
  sessions,
  entries,
  scope,
  basePath,
}: {
  apiUrl: string;
  status: ConnectionStatus;
  sessions: SessionRow[];
  entries: JournalEntry[];
  scope: LogScope;
  basePath: string;
}): React.ReactElement {
  const [searchParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const api = useClientApi(apiUrl);
  const { scales } = useGradeScalePrefs(api);
  const live = useLiveSession(sessionDraftStorage);
  const vocabulary = useClimbVocabulary(api);
  const [editingClimb, setEditingClimb] = React.useState<string | null>(null);
  const gyms = useGyms(api);
  const liveGym = circuitGym(
    gymOfDraft(gyms.gyms, live.stored?.draft.gymId) ?? gyms.gyms[0] ?? null
  );
  const logClimb = (): void => setEditingClimb(live.addClimb(scales, liveGym));
  const stravaConnected = status.strava?.status === "active";
  const stravaLapsed = status.strava !== null && !stravaConnected;
  const gymPrompt = useDismissed("gym");
  const stravaPrompt = useDismissed("strava");
  const setupCards: SetupCard[] = [];
  if (gyms.ready && gyms.gyms.length === 0 && gymPrompt.dismissed === false) {
    setupCards.push({
      key: "gym",
      eyebrow: t("gyms.gym"),
      title: t("gyms.setupTitle"),
      body: t("gyms.setupBody"),
      action: t("gyms.setupAction"),
      to: "/app/settings/gyms/new",
      onDismiss: gymPrompt.dismiss,
    });
  }
  if (!stravaConnected && stravaPrompt.dismissed === false) {
    setupCards.push({
      key: "strava",
      eyebrow: stravaLapsed ? t("sessions.setupEyebrowLapsed") : t("sessions.setupEyebrow"),
      title: stravaLapsed ? t("sessions.setupLapsedTitle") : t("sessions.setupTitle"),
      body: stravaLapsed ? t("sessions.setupLapsedBody") : t("sessions.setupBody"),
      action: stravaLapsed ? t("settings.relinkStrava") : t("sessions.connectStrava"),
      to: "/app/setup",
      onDismiss: stravaPrompt.dismiss,
    });
  }

  const grouping: SessionGrouping = searchParams.get("group") === "tag" ? "tag" : "month";
  const selectedTags = searchParams.getAll("tag");

  const all = React.useMemo(() => logItems(sessions, entries), [sessions, entries]);
  const inScope = React.useMemo(() => logScopeItems(all, scope), [all, scope]);

  const tagOptions = React.useMemo(() => sessionTagOptions(inScope), [inScope]);
  const untaggedCount = React.useMemo(
    () => inScope.filter((i) => i.tags.length === 0).length,
    [inScope]
  );
  const visible = React.useMemo(
    () => filterSessionsByTags(inScope, selectedTags),
    [inScope, selectedTags]
  );

  const years = React.useMemo(
    () => logYearGroups(scope === "all" ? groupTrips(visible) : visible),
    [scope, visible]
  );
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
        <span className="sessions-head-action">
          <LogMenu variant="header" onLogClimb={logClimb} />
        </span>
      </div>
      <SetupStack cards={setupCards} total={2} />
      {live.stored !== null && (
        <LiveSessionCard
          stored={live.stored}
          vocabulary={vocabulary}
          gym={liveGym}
          onEditClimb={setEditingClimb}
          onChangeTries={(key, tries) => live.updateClimb(key, (c) => withTries(c, tries))}
        />
      )}
      <div className="sessions-filters">
        <div className="sessions-filter-row">
          <span className="sessions-filter-label">{t("journal.show")}</span>
          {LOG_SCOPES.map((value) => (
            <Link
              key={value}
              to={
                value === "journal"
                  ? "/app/journal"
                  : value === "all"
                    ? "/app"
                    : `/app?show=${value}`
              }
              aria-current={scope === value ? "page" : undefined}
              className={scope === value ? "sessions-scope-chip is-on" : "sessions-scope-chip"}
            >
              {logScopeLabel(value)}
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
          <Link
            to={`/app/journal/new?kind=journal&date=${today()}`}
            className="sessions-primary-link"
          >
            {t("journal.journalEntry")}
          </Link>
        </div>
      )}
      {inScope.length === 0 && scope !== "journal" && (
        <div className="sessions-first">
          <span className="sessions-first-label">{t("sessions.firstSessionLabel")}</span>
          <p className="sessions-first-body">{t("sessions.firstSessionBody")}</p>
          <Link to="/app/sessions/new" className="sessions-primary-link">
            {t("common.climbingSession")}
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
      <LogMenu variant="fab" onLogClimb={logClimb} />
      {editingClimb !== null && (
        <LiveClimbEditor
          live={live}
          scales={scales}
          vocabulary={vocabulary}
          gym={liveGym}
          editingKey={editingClimb}
          onClose={() => setEditingClimb(null)}
        />
      )}
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
