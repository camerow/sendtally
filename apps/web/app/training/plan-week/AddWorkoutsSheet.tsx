import React from "react";
import { useExerciseList } from "@sendtally/features/statistics";
import type { Block, CalendarDate } from "@sendtally/core/hang";
import { shortDate } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import {
  addKicker,
  addTitle,
  focusLabel,
  useAddTo,
  useTrainingLog,
  type AddFlow,
  blockName,
} from "@sendtally/features/training";
import { kindLabel } from "@sendtally/features/activities";
import {
  entryShelves,
  pickWith,
  useExerciseWorkout,
  usePickerWorld,
  sourcePictures,
  usedInText,
  workoutsWith,
  wrapperOf,
  type ExerciseEntry,
  type PickerEntry,
} from "@sendtally/features/exercises";
import { libraryPictures } from "@sendtally/features/library";
import { libraryLine, libraryShelves, useWorkoutActions } from "@sendtally/features/workouts";
import { Segmented } from "../../components/Segmented";
import { Sheet, type SheetAction } from "../../components/Sheet";
import { useAppApi } from "../../lib/useAppApi";
import { DashedPanel } from "../components/DashedPanel";
import { useHangData } from "../data/HangDataContext";
import { usePlanActions } from "../data/usePlanActions";
import { useLibrary, workoutPath } from "../library/useLibrary";
import { PlanAgainStart } from "../blocks/PlanAgainStart";
import { ScheduleBlocks } from "../blocks/ScheduleBlocks";
import { useNewBlock } from "../blocks/useNewBlock";
import { AddWorkoutRow, type AddState } from "./AddWorkoutRow";
import { useMake } from "../editor/useMake";
import { exercisePath, gripPath } from "../exercises/paths";
import { useToast } from "../../components/Toast";

export type Scheduled = { id: string; name: string; start: CalendarDate };

export type AddWorkoutsSheetProps = {
  /** A day to schedule on, in its block if it has one; or Ongoing, with neither. */
  flow: AddFlow;
  /** Closed with the plans added while it was open. */
  onClose: (added: readonly string[]) => void;
  /** Makes it the Schedule sheet for the day, a block as well as workouts; called once a block's copy is made. */
  onScheduled?: (made: Scheduled) => void;
};

/**
 * Adding workouts to a block or a day: every workout under its focus, searched across all of
 * them, each added with + and taken back with a second click, the sheet staying open for more.
 * Scheduling on a day also offers a block, run from a day it picks in the sheet.
 */
export function AddWorkoutsSheet({
  flow,
  onClose,
  onScheduled,
}: AddWorkoutsSheetProps): React.ReactElement {
  const { model, today } = useHangData();
  const exercises = useExerciseList(useAppApi());
  const api = useAppApi();
  const actions = usePlanActions();
  const { plan } = useTrainingLog(api).log;
  const newBlock = useNewBlock();
  const addTo = useAddTo(api, flow, today, { newId: () => crypto.randomUUID(), actions });
  const [mode, setMode] = React.useState<"workout" | "exercise" | "block">("workout");
  const [picked, setPicked] = React.useState<Block | null>(null);
  const [start, setStart] = React.useState<CalendarDate>(today);
  const [busy, setBusy] = React.useState(false);
  const { state } = useLibrary();
  const [text, setText] = React.useState("");
  // Plans there before it opened; anything since was added here.
  const [before] = React.useState<ReadonlySet<string>>(() => new Set(addTo.plans.map((m) => m.id)));
  const toast = useToast();
  const failed = React.useCallback(
    () => toast.show({ message: t("workouts.saveFailed") }),
    [toast]
  );
  const save = useWorkoutActions(api, failed).saveWorkout;
  const pick = pickWith(useMake());
  const world = usePickerWorld(api, model, [], "all");
  const library = state.status === "ready" ? state.data : null;
  const workouts = library?.workouts ?? [];
  const ensure = useExerciseWorkout({ workouts, pick, save, newId: () => crypto.randomUUID() });
  const shelves = library === null ? [] : libraryShelves(library.workouts, library.usage, { text });
  const added = addTo.plans.filter((m) => !before.has(m.id));
  const stateOf = (mine: string | undefined, there: readonly string[]): AddState =>
    added.some((m) => m.workoutId === mine)
      ? "added"
      : addTo.plans.some((m) => there.includes(m.workoutId))
        ? "there"
        : "none";
  const undo = (workoutId: string | undefined): void =>
    added.filter((m) => m.workoutId === workoutId).forEach((m) => addTo.undo(m.id));
  const addEntry = async (e: ExerciseEntry): Promise<void> => {
    const id = await ensure(e);
    if (id !== null) addTo.add(id);
  };
  const search = mode === "exercise" ? t("workouts.searchExercises") : t("workouts.search");
  const entryPath = ({ source }: PickerEntry): string =>
    "grip" in source
      ? gripPath(source.grip.id)
      : exercisePath("exercise" in source ? source.exercise.id : source.builtIn.id);
  const close = (): void => onClose(added.map((m) => m.id));
  const pickBlock = (b: Block): void => {
    setPicked(b);
    const day = flow.date ?? today;
    setStart(day < today ? today : day);
  };
  const schedule = async (b: Block): Promise<void> => {
    setBusy(true);
    const id = crypto.randomUUID();
    const made = await actions.copyBlock(b.id, id, start);
    setBusy(false);
    if (!made) return;
    close();
    onScheduled?.({ id, name: blockName(b), start });
  };
  const action: SheetAction =
    picked !== null
      ? {
          label: t("plan.scheduleFrom", { day: shortDate(start) }),
          onPress: () => void schedule(picked),
          disabled: busy,
        }
      : mode === "block"
        ? {
            label: t("plan.newBlock"),
            onPress: () => {
              close();
              newBlock();
            },
          }
        : { label: t("common.done"), onPress: close };
  const thereLabel =
    flow.date !== null
      ? t("plan.onDay")
      : flow.blockId === null
        ? t("plan.ongoing")
        : t("plan.inBlock");

  if (picked !== null)
    return (
      <Sheet
        open
        kicker={blockName(picked)}
        title={t("plan.planAgainStart")}
        onBack={() => setPicked(null)}
        onClose={close}
        action={action}
      >
        <PlanAgainStart block={picked} start={start} onPick={setStart} />
      </Sheet>
    );

  return (
    <Sheet
      open
      kicker={addKicker(flow, plan.blocks)}
      title={onScheduled === undefined ? addTitle(flow) : t("plan.schedule")}
      onClose={close}
      cancel={mode === "block"}
      action={action}
    >
      <Segmented
        label={onScheduled === undefined ? addTitle(flow) : t("plan.schedule")}
        value={mode}
        onChange={setMode}
        options={
          onScheduled === undefined
            ? [
                { value: "workout", label: t("plan.tabWorkouts") },
                { value: "exercise", label: t("plan.tabExercises") },
              ]
            : [
                { value: "workout", label: t("plan.workout") },
                { value: "block", label: t("plan.block") },
              ]
        }
      />
      {mode === "block" ? (
        <ScheduleBlocks onPick={pickBlock} />
      ) : (
        <>
          <input
            type="search"
            className="library-search"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={search}
            aria-label={search}
            autoComplete="off"
            maxLength={80}
          />
          <div className="add-shelves">
            {mode === "exercise" ? (
              entryShelves(world, text).map((shelf) => (
                <section key={shelf.kind} className="add-shelf">
                  <h3 className="plan-label plan-label--muted">{kindLabel(shelf.kind)}</h3>
                  {shelf.entries.map((e) => {
                    const mine = wrapperOf(workouts, e)?.id;
                    const using = workoutsWith(workouts, e);
                    return (
                      <AddWorkoutRow
                        key={e.key}
                        kind={e.kind}
                        name={e.name}
                        meta={usedInText(using.length)}
                        picture={sourcePictures(e.source)[0]}
                        to={entryPath(e)}
                        state={stateOf(
                          mine,
                          using.map((w) => w.id)
                        )}
                        thereLabel={thereLabel}
                        onAdd={() => void addEntry(e)}
                        onUndo={() => undo(mine)}
                      />
                    );
                  })}
                </section>
              ))
            ) : (
              <>
                {library !== null && shelves.length === 0 && (
                  <DashedPanel
                    title={t("workouts.noResultsTitle")}
                    body={t("workouts.noResults")}
                  />
                )}
                {shelves.map((shelf) => (
                  <section key={shelf.focus ?? "general"} className="add-shelf">
                    <h3 className="plan-label plan-label--muted">{focusLabel(shelf.focus)}</h3>
                    {shelf.workouts.map((w) => (
                      <AddWorkoutRow
                        key={w.id}
                        kind={w.kind}
                        name={w.name}
                        meta={libraryLine(w, model.settings.units, exercises)}
                        picture={libraryPictures("workout", w.id)[0]}
                        to={workoutPath(w.id)}
                        state={stateOf(w.id, [w.id])}
                        thereLabel={thereLabel}
                        onAdd={() => void addTo.add(w.id)}
                        onUndo={() => undo(w.id)}
                      />
                    ))}
                  </section>
                ))}
              </>
            )}
          </div>
        </>
      )}
    </Sheet>
  );
}
