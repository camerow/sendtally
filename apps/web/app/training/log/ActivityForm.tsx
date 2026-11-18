import { useGrips } from "@sendtally/features/hang";
import { tallyMeasuresOf } from "@sendtally/features/exercises";
import { useExercises } from "@sendtally/features/statistics";
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
  justLoggedText,
  kindLabel,
  minutesOf,
  previousSets,
  useActivities,
  useActivityActions,
  useWeightUnit,
  type ActivityDraft,
  plannedDoses,
} from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import { KIND_LOOK } from "@sendtally/features/training";
import {
  discardRunBody,
  idleNote,
  useWorkoutActions,
  type IdleEnd,
  type PartForm,
} from "@sendtally/features/workouts";
import { NumberField } from "../../components/NumberField";
import { useToast } from "../../components/Toast";
import { DetailFrame } from "../../components/detail/DetailFrame";
import { Sheet } from "../../components/Sheet";
import { useAppApi } from "../../lib/useAppApi";
import { useLiveRunStore } from "../../lib/useLiveRun";
import { askingStore } from "@sendtally/features/workouts";
import { useGoBack } from "../../lib/useGoBack";
import { useHangData } from "../data/HangDataContext";
import { workoutPath } from "../library/useLibrary";
import { DoneDetails } from "./DoneDetails";
import { activityPath } from "./paths";
import { PartSets } from "./PartSets";
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
  /** Where the review cut a run left open, said in amber under the duration until it is changed. */
  idleEnd?: IdleEnd | null;
  /** What the workout prescribes, which a set short of its dose reads against. */
  planned?: readonly SessionItem[];
  /** It reviews the workout running live, which saving or discarding ends. */
  live?: boolean;
  /** A hangboard workout, which saves as a hang session with its setup and no notes or times. */
  hang?: { setup: React.ReactNode; loadKg: number; save: (draft: ActivityDraft) => void };
  /** A mix's fingerboard part, its grips inline in hang mode; it saves with the activity. */
  part?: PartForm;
  gripName?: (id: string) => string;
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
  live = false,
  planned = [],
  idleEnd = null,
  hang,
  part,
  gripName = (id) => id,
}: ActivityFormProps): React.ReactElement {
  const api = useAppApi();
  const { isGrip } = useGrips(api);
  const navigate = useNavigate();
  const back = useGoBack("/app");
  const toast = useToast();
  const liveRun = useLiveRunStore();
  const [discarding, setDiscarding] = React.useState(false);
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
  const [grips, setGrips] = React.useState(() => part && { done: part.done, setup: part.setup });
  const items = itemsOf(draft.done);
  const exercises = useExercises(api).state;
  const measureOf = tallyMeasuresOf(
    exercises.status === "ready" ? exercises.data : [],
    draft.kind,
    isGrip
  );
  const note = idleNote(idleEnd, draft.minutes);
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
  /** A live run's review leaves to what waited on it, if anything did, which then opens in its place. */
  const leave = (): void => {
    if (live && askingStore.waiting()) liveRun.clear();
    else {
      if (live) liveRun.clear();
      back();
    }
  };
  const [saving, setSaving] = React.useState(false);
  /** Leaves only once the server holds it, so a failed save keeps the form and what is in it. */
  const save = async (): Promise<void> => {
    if (hang !== undefined) {
      if (live) liveRun.clear();
      hang.save(draft);
      return;
    }
    setSaving(true);
    const saved = await actions.saveActivity(activityFromDraft(id, draft));
    setSaving(false);
    if (!saved) return;
    if (logged === null)
      toast.show({
        message: justLoggedText({ id, name: draft.title.trim() || kindLabel(draft.kind) }),
        action: { label: t("common.view"), onPress: () => void navigate(activityPath(id)) },
      });
    const fingerboard = part && grips && part.body(grips.done, grips.setup);
    void actions.saveActivity({
      ...activityFromDraft(id, draft),
      ...(fingerboard !== undefined && { fingerboard }),
    });
    leave();
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
      backLabel={live ? t("hang.discard") : t("common.cancel")}
      {...(live && { onBack: () => setDiscarding(true) })}
      editor={{
        title:
          logged !== null
            ? t("summary.editWorkout")
            : reviewing
              ? t("activities.logWorkout")
              : t("activities.logActivity"),
        onSave: () => void save(),
        saveDisabled: saving,
        heading: draft.workoutId === null,
      }}
    >
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
          {note !== null && <p className="form-idle-note">{note}</p>}
        </div>
      )}
      <EffortField value={draft.rpe} onChange={(rpe) => update({ rpe })} />
      <FocusField value={draft.focus} onChange={(focus) => update({ focus })} />
      {part !== undefined && grips !== undefined && (
        <div className="form-section">
          <span className="train-label" style={{ color: KIND_LOOK.hangboard.ink }}>
            {t("workouts.fingerboard")}
          </span>
          <PartSets
            done={grips.done}
            planned={part.planned}
            setup={grips.setup}
            kind={part.kind}
            unit={unit}
            gripName={gripName}
            onSetup={(setup) => setGrips({ ...grips, setup })}
            onChange={(done) => setGrips({ ...grips, done })}
            onRemoved={(message, undo) =>
              toast.show({ message, action: { label: t("tally.undo"), onPress: undo } })
            }
          />
        </div>
      )}
      {draft.done.length > 0 && (
        <DoneDetails
          done={draft.done}
          off={draft.off}
          planned={plannedDoses(planned, draft.done)}
          unit={unit}
          color={KIND_LOOK[look].ink}
          hangs={hang !== undefined}
          previous={previous}
          laps={(exercise) => measureOf(exercise) === "laps"}
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
      <Sheet
        open={discarding}
        title={t("hang.discardRunTitle")}
        onClose={() => setDiscarding(false)}
        action={{
          label: t("hang.discard"),
          danger: true,
          onPress: () => {
            setDiscarding(false);
            leave();
          },
        }}
      >
        <p className="sheet-body">{discardRunBody(liveRun.read())}</p>
      </Sheet>
    </DetailFrame>
  );
}
