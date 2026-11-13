import React from "react";
import { useSearchParams } from "react-router";
import {
  CLIMB_STATUSES,
  climbLog,
  climbingSessionVM,
  gradeFilterLabel,
  useClimbs,
  type ClimbStatusFilter,
  type GradeFilter,
} from "@sendtally/features/climbs";
import { t, type MessageKey } from "@sendtally/features/i18n";
import { groupTrips, type LogItem } from "@sendtally/features/journal";
import { logCountLabel, logYearGroups } from "@sendtally/features/sessions";
import { useGradeScalePrefs } from "@sendtally/features/settings";
import { FilterChip } from "../../components/FilterChip";
import { Icon } from "../../components/Icon";
import { useAppApi } from "../../lib/useAppApi";
import { SectionHeader } from "../../sessions/components/SectionHeader";
import { ClimbingEmpty } from "./ClimbingEmpty";
import { ClimbingLogCell } from "./ClimbingLogCell";
import { GradeFilterSheet } from "./GradeFilterSheet";
import type { ClimbingLogRow } from "./types";

/** `meta` is null on the flat climbs list, whose groups are labelled lightly or not at all. */
type Section = { key: string; title: string | null; meta: string | null; rows: ClimbingLogRow[] };

const STATUS_LABELS: Record<ClimbStatusFilter, MessageKey> = {
  all: "climbs.statusAll",
  projects: "climbs.statusProjects",
  sent: "climbs.statusSent",
  notYet: "climbs.statusNotYet",
};

/** The status filter is in the URL, so a link (and /app/projects) lands on Projects. */
const statusOf = (value: string | null): ClimbStatusFilter =>
  CLIMB_STATUSES.find((s) => s === value) ?? "all";

/**
 * Climbing sessions by date with their climbs set in under them. Search, a grade range or a
 * status turns it into the flat list of every climb that matches.
 */
export function ClimbingLog({ items }: { items: LogItem[] }): React.ReactElement {
  const api = useAppApi();
  const { state } = useClimbs(api);
  const { scales } = useGradeScalePrefs(api);
  const [params, setParams] = useSearchParams();
  const status = statusOf(params.get("status"));
  const [query, setQuery] = React.useState("");
  const [grade, setGrade] = React.useState<GradeFilter | null>(null);
  const [picking, setPicking] = React.useState(false);
  const ready = state.status === "ready" ? state.data : null;
  const filtered = query.trim() !== "" || grade !== null || status !== "all";
  const searchable = filtered || state.status === "error" || (ready?.climbs.length ?? 0) > 0;
  const log = React.useMemo(
    () =>
      ready === null
        ? null
        : climbLog(ready.climbs, ready.sessions, { query, grade, status, scales }),
    [ready, query, grade, status, scales]
  );
  const nested = React.useMemo(
    () =>
      new Map(
        (ready?.sessions ?? []).map((s) => [
          s.fingerprint,
          climbingSessionVM(s, ready?.climbs ?? [], scales),
        ])
      ),
    [ready, scales]
  );
  const sections = React.useMemo((): Section[] => {
    if (filtered) {
      return (log?.groups ?? []).map((g) => ({
        key: g.key,
        title: g.label,
        meta: null,
        rows: g.rows.map((row) => ({ type: "climb", key: `climb:${row.id}`, row })),
      }));
    }
    return logYearGroups(groupTrips(items)).flatMap((year) =>
      year.months.map((m) => ({
        key: m.key,
        title: m.name,
        meta: t("sessions.monthMeta", { year: m.year, sessions: logCountLabel(m.items) }),
        rows: m.items,
      }))
    );
  }, [filtered, log, items]);

  const setStatus = (next: ClimbStatusFilter): void =>
    setParams(
      (was) => {
        const p = new URLSearchParams(was);
        if (next === "all") p.delete("status");
        else p.set("status", next);
        return p;
      },
      { replace: true, preventScrollReset: true }
    );

  return (
    <div className="climbing-log">
      {searchable && (
        <div className="climbing-filters">
          <label className="climbing-search">
            <Icon name="search" size={18} strokeWidth={2} />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("climbs.search")}
              aria-label={t("climbs.search")}
              autoComplete="off"
              spellCheck={false}
            />
          </label>
          <div className="climbing-chips">
            <FilterChip
              label={grade === null ? t("climbs.anyGrade") : gradeFilterLabel(grade)}
              active={grade !== null}
              icon="insights"
              onPress={() => setPicking(true)}
            />
            {CLIMB_STATUSES.map((s) => (
              <FilterChip
                key={s}
                label={t(STATUS_LABELS[s], { n: log?.counts[s] ?? 0 })}
                active={s === status}
                onPress={() => setStatus(s)}
              />
            ))}
          </div>
          {state.status === "error" && (
            <span className="climbing-error">{t("climbs.loadFailed")}</span>
          )}
        </div>
      )}
      {sections.map((section) => (
        <section key={section.key}>
          {section.meta !== null && section.title !== null ? (
            <SectionHeader title={section.title} meta={section.meta} />
          ) : (
            section.title !== null && <h2 className="climbing-group-label">{section.title}</h2>
          )}
          {section.rows.map((row) => (
            <ClimbingLogCell key={row.key} item={row} nested={nested} />
          ))}
        </section>
      ))}
      {filtered && ready !== null && sections.length === 0 && (
        <p className="climbing-empty">
          {ready.climbs.length === 0 ? t("climbs.empty") : t("climbs.noMatches")}
        </p>
      )}
      {!filtered && items.length === 0 && <ClimbingEmpty />}
      <GradeFilterSheet
        open={picking}
        value={grade}
        scales={scales}
        climbs={ready?.climbs ?? []}
        onChange={setGrade}
        onClose={() => setPicking(false)}
      />
    </div>
  );
}
