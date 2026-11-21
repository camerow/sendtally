import React from "react";
import { useSearchParams } from "react-router";
import type {
  Activity,
  HangHistoryPart,
  HangHistoryRow,
  JournalEntry,
  SessionRow,
} from "@sendtally/api-client";
import { useGyms } from "@sendtally/features/gyms";
import { t } from "@sendtally/features/i18n";
import { useClimbs } from "@sendtally/features/climbs";
import {
  NO_LOG_FILTER,
  filterLog,
  logExerciseOptions,
  logFilterActive,
  logFilterFromParams,
  logFilterPills,
  logItems,
  logPlaceOptions,
  logTraining,
  logWorkoutOptions,
  today,
  writeLogFilterParams,
  type LogContext,
  type LogFilter,
  type LogOption,
} from "@sendtally/features/journal";
import { sessionTagOptions } from "@sendtally/features/sessions";
import { useGradeScalePrefs } from "@sendtally/features/settings";
import { useTrainingLog } from "@sendtally/features/training";
import { statsYears } from "@sendtally/features/trends";
import { ClimbingEmpty } from "../../climbs/components/ClimbingEmpty";
import { AccountButton } from "../../components/AccountButton";
import { useAppApi } from "../../lib/useAppApi";
import { useQueryUpdate } from "../useQueryUpdate";
import { ActiveFilters } from "./ActiveFilters";
import { FilterSheet, type FilterChoices } from "./FilterSheet";
import { LogList } from "./LogList";
import { LogMenu } from "./LogMenu";

export type LogPageProps = {
  sessions: SessionRow[];
  hangSessions: HangHistoryRow[];
  hangParts: HangHistoryPart[];
  activities: Activity[];
  entries: JournalEntry[];
};

/** The filter lives in the link, so a filtered Log can be shared; search stays on the page. */
export function LogPage({
  sessions,
  hangSessions,
  hangParts,
  activities,
  entries,
}: LogPageProps): React.ReactElement {
  const api = useAppApi();
  const gyms = useGyms(api);
  const [params] = useSearchParams();
  const updateQuery = useQueryUpdate();
  const [search, setSearch] = React.useState("");
  const [searching, setSearching] = React.useState(false);
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const filter = React.useMemo(
    () => ({ ...logFilterFromParams(params), search }),
    [params, search]
  );
  const setFilter = (next: LogFilter): void => {
    setSearch(next.search);
    updateQuery((p) => writeLogFilterParams(p, next));
  };
  const { log: trainingLog } = useTrainingLog(api);
  const training = React.useMemo(() => logTraining(trainingLog, today()), [trainingLog]);
  const items = React.useMemo(
    () => logItems(sessions, entries, hangSessions, activities, training),
    [sessions, entries, hangSessions, activities, training]
  );
  const climbs = useClimbs(api);
  const { scales } = useGradeScalePrefs(api);
  const climbData = climbs.state.status === "ready" ? climbs.state.data : null;
  const ctx = React.useMemo(
    (): LogContext => ({
      climbs: climbData?.climbs ?? [],
      sessions: climbData?.sessions ?? [],
      hangParts,
      memberships: trainingLog.plan.memberships,
      places: new Map([
        ...(climbData?.climbs ?? []).flatMap((c) =>
          c.area === null ? [] : [[c.area.id, c.area.name] as const]
        ),
        ...gyms.gyms.map((g) => [g.id, g.name] as const),
      ]),
      scales,
    }),
    [climbData, hangParts, trainingLog.plan.memberships, gyms.gyms, scales]
  );
  const view = React.useMemo(() => filterLog(items, filter, ctx), [items, filter, ctx]);
  const choices = React.useMemo(
    (): FilterChoices => ({
      years: statsYears({ sessions, hangSessions, activities }),
      tags: sessionTagOptions(items),
      places: logPlaceOptions(items, ctx),
      exercises: logExerciseOptions(items, ctx),
      blocks: trainingLog.plan.blocks.map((b) => ({ key: b.id, name: b.name })),
      workouts: logWorkoutOptions(items, ctx, (id) => trainingLog.workout(id)?.name ?? null),
    }),
    [sessions, hangSessions, activities, items, ctx, trainingLog]
  );
  const pills = React.useMemo(() => {
    const named = (options: readonly LogOption[], key: string): string =>
      options.find((o) => o.key === key)?.name ?? key;
    return logFilterPills(filter, {
      tag: (slug) => choices.tags.find((tag) => tag.slug === slug)?.name ?? slug,
      place: (key) => named(choices.places, key),
      exercise: (key) => named(choices.exercises, key),
      block: (key) => named(choices.blocks, key),
      workout: (key) => named(choices.workouts, key),
    });
  }, [filter, choices]);
  const fresh = items.length === 0;

  return (
    <div className="log-page">
      <div className="log-page-head">
        <h1 className="log-page-title">{t("journal.log")}</h1>
        {!fresh && <LogMenu variant="header" />}
        <AccountButton />
      </div>
      {fresh ? (
        <ClimbingEmpty />
      ) : (
        <LogList
          view={view}
          below={
            <ActiveFilters
              pills={pills}
              onDrop={(pill) => setFilter({ ...pill.without, search })}
              onClearAll={() => setFilter({ ...NO_LOG_FILTER, search })}
            />
          }
          empty={<p className="climbing-empty log-nothing">{t("sessions.nothingMatches")}</p>}
          filtersActive={logFilterActive({ ...filter, search: "" })}
          onOpenFilters={() => setFiltersOpen(true)}
          search={{
            open: searching,
            text: search,
            onOpen: () => setSearching(true),
            onChangeText: setSearch,
            onCancel: () => {
              setSearching(false);
              setSearch("");
            },
          }}
        />
      )}
      <FilterSheet
        open={filtersOpen}
        items={items}
        ctx={ctx}
        choices={choices}
        filter={filter}
        onApply={(next) => {
          setFilter(next);
          setFiltersOpen(false);
          window.scrollTo({ top: 0 });
        }}
        onClose={() => setFiltersOpen(false)}
      />
      {!fresh && <LogMenu variant="fab" />}
    </div>
  );
}
