import React from "react";
import { t } from "@sendtally/features/i18n";
import {
  logWorkoutName,
  trainingLogItems,
  type LogItem,
  type LogScope,
} from "@sendtally/features/journal";
import { logCountLabel, logYearGroups, monthScopeItems } from "@sendtally/features/sessions";
import { ActivityRow } from "./ActivityRow";
import { BlockDoneRow } from "./BlockDoneRow";
import { EntryRow } from "./EntryRow";
import { FilterSheet } from "./FilterSheet";
import { HangRow } from "./HangRow";
import { ScopeBar } from "./ScopeBar";
import { SectionHeader, sectionId } from "./SectionHeader";
import { TrainingEmpty } from "./TrainingEmpty";
import { WorkoutFilterBar } from "./WorkoutFilterBar";

function TrainingRow({ item }: { item: LogItem }): React.ReactElement | null {
  if (item.type === "hang") return <HangRow hang={item.hang} blockTag={item.blockTag} />;
  if (item.type === "activity")
    return <ActivityRow activity={item.activity} blockTag={item.blockTag} />;
  if (item.type === "entry") return <EntryRow entry={item.entry} />;
  if (item.type === "block") return <BlockDoneRow recap={item.recap} />;
  return null;
}

/** The month whose header last scrolled under the top of the window. */
function useCurrentSection(keys: readonly string[]): string | null {
  const [current, setCurrent] = React.useState<string | null>(null);
  React.useEffect(() => {
    const update = (): void => {
      let at: string | null = keys[0] ?? null;
      for (const key of keys) {
        const top = document.getElementById(sectionId(key))?.getBoundingClientRect().top;
        if (top !== undefined && top <= 80) at = key;
      }
      setCurrent(at);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [keys]);
  return current;
}

/** The training half: hangs, other workouts and journal entries by month, filterable, narrowable to one workout. */
export function TrainingLog({
  items,
  workout,
  onClearWorkout,
}: {
  items: LogItem[];
  workout: string | null;
  onClearWorkout: () => void;
}): React.ReactElement {
  const [scope, setScope] = React.useState<LogScope>("all");
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const inScope = React.useMemo(
    () => trainingLogItems(items, scope, workout),
    [items, scope, workout]
  );
  const workoutName = React.useMemo(() => logWorkoutName(items, workout), [items, workout]);
  const years = React.useMemo(() => logYearGroups(inScope), [inScope]);
  const keys = React.useMemo(() => years.flatMap((y) => y.months.map((m) => m.key)), [years]);
  const current = useCurrentSection(keys);
  const filtersActive = scope !== "all" || workout !== null;

  return (
    <div className="training-log">
      {(keys.length > 0 || filtersActive) && (
        <ScopeBar
          items={monthScopeItems(years)}
          currentKey={current}
          onSelect={(key) =>
            document.getElementById(sectionId(key))?.scrollIntoView({ block: "start" })
          }
          filtersActive={filtersActive}
          onOpenFilters={() => setFiltersOpen(true)}
        />
      )}
      {workoutName !== null && <WorkoutFilterBar name={workoutName} onClear={onClearWorkout} />}
      {years.map((year) =>
        year.months.map((m) => (
          <section key={m.key}>
            <SectionHeader
              sectionKey={m.key}
              title={m.name}
              meta={t("sessions.monthMeta", { year: m.year, sessions: logCountLabel(m.items) })}
            />
            {m.items.map((item) => (
              <TrainingRow key={item.key} item={item} />
            ))}
          </section>
        ))
      )}
      {inScope.length === 0 &&
        (items.length === 0 && workout === null ? (
          <TrainingEmpty />
        ) : (
          <div className="training-empty">
            <span className="training-empty-title">
              {scope === "journal" ? t("journal.emptyTitle") : t("training.logEmptyTitle")}
            </span>
            <span className="training-empty-body">
              {scope === "journal" ? t("journal.emptyBody") : t("training.logEmptyBody")}
            </span>
          </div>
        ))}
      <FilterSheet
        open={filtersOpen}
        items={items}
        scope={scope}
        onApply={(next) => {
          setScope(next);
          setFiltersOpen(false);
          window.scrollTo({ top: 0 });
        }}
        onClose={() => setFiltersOpen(false)}
      />
    </div>
  );
}
