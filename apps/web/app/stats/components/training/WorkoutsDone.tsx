import React from "react";
import { Link } from "react-router";
import { t } from "@sendtally/features/i18n";
import type { WorkoutDoneVM, WorkoutGroupVM } from "@sendtally/features/statistics";
import { KIND_LOOK } from "@sendtally/features/training";
import { ExpandableRow } from "../../../components/ExpandableRow";
import { Icon } from "../../../components/Icon";
import { CategoryRow } from "../../../training/components/CategoryRow";
import { activityPath } from "../../../training/log/paths";

export type WorkoutsDoneProps = {
  groups: WorkoutGroupVM[];
  /** The training mix row narrowing the list, by name. */
  picked: string | null;
  onClear: () => void;
};

function Sessions({ row }: { row: WorkoutDoneVM }): React.ReactElement {
  return (
    <>
      {row.sessions.map((s) => (
        <Link key={s.id} to={activityPath(s.id)} className="workout-session">
          <span className="workout-session-date">{s.dateLabel}</span>
          <span className="stats-meta">{s.duration}</span>
          <span className="workout-session-rpe">{s.rpe}</span>
        </Link>
      ))}
      <Link
        to={`/app?${new URLSearchParams({ segment: "training", workout: row.key })}`}
        className="workout-all"
      >
        {t("statistics.allInLog", { n: row.total })}
        <Icon name="chevron" size={12} />
      </Link>
    </>
  );
}

/** Every workout done in range, grouped like the training mix, the most done first; one opens in place to its last sessions. */
export function WorkoutsDone({
  groups,
  picked,
  onClear,
}: WorkoutsDoneProps): React.ReactElement | null {
  const [open, setOpen] = React.useState<string | null>(null);
  if (groups.length === 0 && picked === null) return null;
  return (
    <>
      <div className="stats-card-head">
        <h2 className="stats-label">
          {picked === null
            ? t("statistics.workoutsMostDone")
            : t("statistics.workoutsOf", { name: picked })}
        </h2>
        {picked !== null && (
          <button type="button" className="stats-clear" onClick={onClear}>
            {t("common.clear")}
          </button>
        )}
      </div>
      {groups.length === 0 && (
        <p className="stats-empty">{t("statistics.noWorkoutsPicked", { name: picked ?? "" })}</p>
      )}
      {groups.map((g) => (
        <div key={g.key}>
          <span
            className="stats-group-label"
            style={g.kind === null ? undefined : { color: KIND_LOOK[g.kind].ink }}
          >
            {g.label}
          </span>
          {g.rows.map((r) => {
            const id = `${g.key}:${r.key}`;
            const expanded = open === id;
            return (
              <ExpandableRow
                key={r.key}
                expanded={expanded}
                onToggle={() => setOpen(expanded ? null : id)}
                label={`${r.name}, ${r.meta}`}
                body={<Sessions row={r} />}
              >
                <CategoryRow kind={r.kind} name={r.name} meta={r.meta} showKind={g.kind === null} />
              </ExpandableRow>
            );
          })}
        </div>
      ))}
    </>
  );
}
