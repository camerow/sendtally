import React from "react";
import { useNavigate } from "react-router";
import type { ActivityRecord } from "@sendtally/api-client";
import {
  defaultExerciseRestS,
  type ItemDone,
  type SessionItem,
  type SetDone,
} from "@sendtally/core/hang";
import {
  activityFromDraft,
  kindLabel,
  minutesOf,
  previousSets,
  useActivities,
  useActivityActions,
  useWeightUnit,
  type ActivityDraft,
} from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import { KIND_LOOK } from "@sendtally/features/training";
import { useWorkoutActions } from "@sendtally/features/workouts";
import { NumberField } from "../../components/NumberField";
import { useToast } from "../../components/Toast";
import { DetailFrame } from "../../components/detail/DetailFrame";
import { useAppApi } from "../../lib/useAppApi";
import { useGoBack } from "../../lib/useGoBack";
import { useHangData } from "../data/HangDataContext";
import { workoutPath } from "../library/useLibrary";
import { DoneDetails } from "./DoneDetails";
import { EffortField } from "./EffortField";
import { FocusField } from "./FocusField";
import { KindChips } from "./KindChips";

export type ActivityFormProps = {
  id: string;
  initial: ActivityDraft;
  /** The activity as logged; null while logging a new one. */
  logged: ActivityRecord | null;
  /** It came with a kind, from a workout; a logged activity always has one. */
  kindSet?: boolean;
  /** What the workout prescribes, which a set short of its dose reads against. */
  planned?: readonly SessionItem[];
  /** A hangboard workout, which saves as a hang session with its setup and no notes or times. */
  hang?: { setup: React.ReactNode; loadKg: number; save: (draft: ActivityDraft) => void };
};

/** What was done as a workout to run again: each item's first set, as many times as it was done. */
const itemsOf = (done: readonly ItemDone[]) =>
  done
    .filter((d) => d.sets.length > 0)
    .map((d) => ({ exercise: d.exercise, dose: { ...d.sets[0], sets: d.sets.length } }));

/**
 * Log or edit one activity: kind, title, when, how long, how hard, its focus, and a row per
 * set to tick. Save sits at the foot of the column.
 */
export function ActivityForm({
  id,
  initial,
  logged,
  kindSet = false,
  planned = [],
  hang,
}: ActivityFormProps): React.ReactElement {
  const api = useAppApi();
  const navigate = useNavigate();
  const back = useGoBack("/app");
  const toast = useToast();
  const { today } = useHangData();
  const failed = React.useCallback(
    () => toast.show({ message: t("activities.saveFailed") }),
    [toast]
  );
  const actions = useActivityActions(api, failed);
  const workouts = useWorkoutActions(api, failed);
  const activities = useActivities(api).state;
  const unit = useWeightUnit(api);
  const [draft, setDraft] = React.useState(initial);
  const update = (patch: Partial<ActivityDraft>): void => setDraft((d) => ({ ...d, ...patch }));
  const items = itemsOf(draft.done);
  const name = draft.title.trim() || kindLabel(draft.kind);
  const look = hang === undefined ? draft.kind : "hangboard";
  const reviewing = logged === null && draft.workoutId !== null;
  const ids = {
    date: React.useId(),
    start: React.useId(),
    title: React.useId(),
    notes: React.useId(),
  };

  const previous = (exercise: string): SetDone[] =>
    draft.kind === "strength" && draft.workoutId !== null && activities.status === "ready"
      ? previousSets(activities.data, draft.workoutId, exercise)
      : [];
  const save = (): void => {
    if (hang !== undefined) {
      hang.save(draft);
      return;
    }
    void actions.saveActivity(activityFromDraft(id, draft));
    back();
  };
  const saveAsWorkout = (): void => {
    if (items.length === 0) return;
    const workoutId = crypto.randomUUID();
    void workouts.saveWorkout(workoutId, {
      kind: draft.kind,
      name: draft.title.trim() || kindLabel(draft.kind),
      description: "",
      minutes: draft.minutes,
      targetRpe: draft.rpe,
      items: items.map(({ exercise, dose }) => ({ exercise, doses: [dose] })),
      exerciseRestS: defaultExerciseRestS(draft.kind),
      focus: draft.focus,
    });
    void navigate(workoutPath(workoutId));
  };

  return (
    <DetailFrame
      backTo="/app"
      backLabel={t("common.cancel")}
      footer={
        <button type="button" className="detail-primary" onClick={save}>
          {t("common.save")}
        </button>
      }
    >
      <span className="train-label form-mode">
        {logged !== null
          ? t("summary.editWorkout")
          : reviewing
            ? t("activities.logWorkout")
            : t("activities.logActivity")}
      </span>
      {logged === null && !kindSet && (
        <KindChips value={draft.kind} onChange={(kind) => update({ kind })} />
      )}
      {draft.workoutId !== null ? (
        <div className="intro">
          {reviewing && (
            <span className="train-label" style={{ color: KIND_LOOK[look].ink }}>
              {kindLabel(look)}
            </span>
          )}
          <h1 className="train-title form-title">{name}</h1>
        </div>
      ) : (
        <div className="form-section">
          <label htmlFor={ids.title} className="train-label">
            {t("activities.title")}
          </label>
          <input
            id={ids.title}
            className="form-input"
            value={draft.title}
            maxLength={80}
            placeholder={kindLabel(draft.kind)}
            onChange={(e) => update({ title: e.target.value })}
          />
        </div>
      )}
      <div className="form-row">
        <div className="form-section">
          <label htmlFor={ids.date} className="train-label">
            {t("activities.date")}
          </label>
          <input
            id={ids.date}
            type="date"
            className="form-input"
            value={draft.date}
            max={today}
            required
            onChange={(e) => e.target.value !== "" && update({ date: e.target.value })}
          />
        </div>
        {hang === undefined && (
          <div className="form-section">
            <label htmlFor={ids.start} className="train-label">
              {t("activities.startTime")}
            </label>
            <input
              id={ids.start}
              type="time"
              className="form-input"
              value={draft.startTime}
              onChange={(e) => update({ startTime: e.target.value })}
            />
          </div>
        )}
      </div>
      {hang === undefined && (
        <div className="form-section">
          <NumberField
            label={t("common.duration")}
            value={draft.minutes * 60}
            mode={{ kind: "time", min: 60 }}
            onChange={(seconds) => update({ minutes: minutesOf(seconds) })}
          />
        </div>
      )}
      <EffortField value={draft.rpe} onChange={(rpe) => update({ rpe })} />
      <FocusField value={draft.focus} onChange={(focus) => update({ focus })} />
      {draft.done.length > 0 && (
        <DoneDetails
          done={draft.done}
          off={draft.off}
          planned={planned.map((p) => p.dose)}
          unit={unit}
          color={KIND_LOOK[look].ink}
          hangs={hang !== undefined}
          previous={previous}
          setup={hang?.setup}
          {...(hang !== undefined && { hangLoadKg: hang.loadKg })}
          onRemoved={(message, undo) =>
            toast.show({ message, action: { label: t("tally.undo"), onPress: undo } })
          }
          onChange={(done, off) => update({ done, off })}
        />
      )}
      {hang === undefined && (
        <div className="form-section">
          <label htmlFor={ids.notes} className="train-label">
            {t("common.notes")}
          </label>
          <textarea
            id={ids.notes}
            className="form-input form-notes"
            value={draft.notes}
            maxLength={2000}
            placeholder={t("common.notesPlaceholder")}
            onChange={(e) => update({ notes: e.target.value })}
          />
        </div>
      )}
      {logged !== null && items.length > 0 && (
        <button type="button" className="text-button form-link" onClick={saveAsWorkout}>
          {t("workouts.saveAsWorkout")}
        </button>
      )}
    </DetailFrame>
  );
}
