import React from "react";
import { useExerciseList } from "@sendtally/features/exercises";
import { useNavigate } from "react-router";
import type { Weekday } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import {
  daysThisWeek,
  hasDays,
  ongoingMembers,
  planGridRows,
  scheduleOf,
  usePlan,
  usePlanDraft,
  useTrainingLog,
  useLit,
} from "@sendtally/features/training";
import { DetailFrame } from "../../components/detail/DetailFrame";
import { Icon } from "../../components/Icon";
import { useAppApi } from "../../lib/useAppApi";
import { useDiscardGuard } from "../../lib/useDiscardGuard";
import { CategoryMark } from "../components/CategoryMark";
import { PlanGrid } from "../components/PlanGrid";
import { useHangData } from "../data/HangDataContext";
import { LoadState } from "../data/LoadState";
import { usePlanActions } from "../data/usePlanActions";
import { workoutPath } from "../library/useLibrary";
import { AddWorkoutsSheet } from "../plan-week/AddWorkoutsSheet";

/** The weekly plans in no block: their week, and Edit to set their days, add and take them out. */
export function OngoingPage(): React.ReactElement {
  const navigate = useNavigate();
  const { today, model } = useHangData();
  const exercises = useExerciseList(useAppApi());
  const api = useAppApi();
  const plan = usePlan(api);
  const { log } = useTrainingLog(api);
  const draft = usePlanDraft(log.plan, usePlanActions());
  const guard = useDiscardGuard(draft.dirty);
  const [adding, setAdding] = React.useState(false);
  const [added, setAdded] = useLit();

  if (plan.state.status !== "ready")
    return <LoadState state={plan.state} onRetry={() => void plan.reload()} />;
  const members = ongoingMembers(draft.plan, today);
  const shown = members.map((m) => ({ ...m, weekdays: daysThisWeek(draft.plan, m, null, today) }));
  const open = (m: { workoutId: string }): void => void navigate(workoutPath(m.workoutId));
  const rows = planGridRows(
    shown,
    log.workout,
    model,
    draft.editing
      ? {
          exercises,
          open,
          toggle: (m, day) => () =>
            draft.toggle(m.id, { week: 1, day: day as Weekday, following: true, last: 1 }),
        }
      : { exercises, open }
  );
  const dayless = members.filter((m) => !hasDays(scheduleOf(draft.plan, m)));

  return (
    <DetailFrame
      backTo="/app/train"
      {...(draft.editing
        ? {
            onBack: () => guard.ask(draft.cancel),
            editor: { title: t("plan.editOngoing"), onSave: draft.save, solid: true },
          }
        : {
            action: (
              <button type="button" className="outline-action" onClick={draft.begin}>
                {t("common.edit")}
              </button>
            ),
          })}
    >
      <div className="schedule-head">
        <h1 className="schedule-title">{t("plan.ongoing")}</h1>
        <span className="plan-row-meta">{t("plan.ongoingRepeats")}</span>
      </div>
      {rows.length > 0 && (
        <PlanGrid rows={rows} lit={added} editing={draft.editing} title={t("plan.week")} />
      )}
      {draft.editing && dayless.length > 0 && (
        <p className="sheet-copy">
          {t("plan.tapDays", {
            workout: dayless.map((m) => log.workout(m.workoutId)?.name ?? "").join(", "),
            count: dayless.length,
          })}
        </p>
      )}
      {draft.editing && (
        <>
          <button type="button" className="add-workout-button" onClick={() => setAdding(true)}>
            <Icon name="plus" size={18} strokeWidth={2.4} />
            {t("plan.addToPlan")}
          </button>
          {members.length > 0 && (
            <section className="ongoing-workouts">
              <h2 className="plan-label">{t("plan.tabWorkouts")}</h2>
              {members.map((m) => {
                const w = log.workout(m.workoutId);
                const name = w?.name ?? "";
                return (
                  <div key={m.id} className="ongoing-workout">
                    {w !== undefined && <CategoryMark kind={w.kind} />}
                    <span className="plan-row-name">{name}</span>
                    <button
                      type="button"
                      className="ongoing-remove"
                      aria-label={t("plan.remove", { title: name })}
                      onClick={() => draft.remove(m.id)}
                    >
                      <Icon name="x" size={18} strokeWidth={2} />
                    </button>
                  </div>
                );
              })}
            </section>
          )}
        </>
      )}
      {adding && (
        <AddWorkoutsSheet
          flow={{ date: null, blockId: null }}
          onClose={(ids) => {
            setAdding(false);
            setAdded(ids);
          }}
        />
      )}
      {guard.sheet}
    </DetailFrame>
  );
}
