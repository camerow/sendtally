import { randomUUID } from "expo-crypto";
import { router, useFocusEffect } from "expo-router";
import React from "react";
import type { Block, CalendarDate, WorkoutKind } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { shortDate } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { focusLabel, usePlan, blockName } from "@sendtally/features/training";
import {
  entryOf,
  entryShelves,
  pickWith,
  useExerciseWorkout,
  sourcePictures,
  usedInText,
  workoutsWith,
  wrapperOf,
  type ExerciseEntry,
  type PickerEntry,
} from "@sendtally/features/exercises";
import { libraryPictures } from "@sendtally/features/library";
import { kindLabel } from "@sendtally/features/activities";
import { libraryLine, libraryShelves, useWorkoutActions } from "@sendtally/features/workouts";
import { Alert, View } from "react-native";
import { useApi } from "../../../lib/api";
import { Button } from "../components/Button";
import { DashedPanel } from "../components/DashedPanel";
import { Label } from "../components/Label";
import { Segmented } from "../components/Segmented";
import { SheetHeader } from "../components/SheetHeader";
import { useHangData } from "../data/HangDataContext";
import { usePickerWorld } from "../exercise-picker/usePickerWorld";
import { openExerciseEditor } from "../exercises/openExerciseEditor";
import { useMakeExercise } from "../exercises/useMakeExercise";
import { HangSheet } from "../data/HangSheet";
import { LibrarySearch } from "../library/LibrarySearch";
import { NewWorkoutSheet } from "../library/NewWorkoutSheet";
import { useLibrary } from "../library/useLibrary";
import { usePlanActions } from "../plan/usePlanActions";
import { useReminderPrompt } from "../reminders/ReminderPromptProvider";
import { AddWorkoutRow, type AddState } from "./AddWorkoutRow";
import { addFlowParams, addKicker, addTitle, type AddFlow } from "@sendtally/features/training";
import { PlanAgainStart } from "./PlanAgainStart";
import { ScheduleBlocks } from "./ScheduleBlocks";
import { useAddTo } from "./useAddTo";
import { useNewBlock } from "./useNewBlock";

const failed = (): void => Alert.alert(t("workouts.saveFailed"));

export type AddWorkoutsSheetProps = {
  flow: AddFlow;
  visible: boolean;
  /** Closed with the plans added while it was open. */
  onClose: (added: readonly string[]) => void;
  /** Makes it the Schedule sheet for the day, a block as well as workouts; called once a block's copy is made. */
  onScheduled?: (made: Scheduled) => void;
};

export type Scheduled = { id: string; name: string; start: CalendarDate };

/**
 * Adding workouts to a block or a day: every workout under its focus, searched across all of
 * them, each added with + and taken back with a second tap, the sheet staying open for more.
 * Scheduling on a day also offers a block, run from a day it picks in the sheet.
 */
export function AddWorkoutsSheet({
  flow,
  visible,
  onClose,
  onScheduled,
}: AddWorkoutsSheetProps): React.ReactElement {
  const { model, today } = useHangData();
  const actions = usePlanActions();
  const prompt = useReminderPrompt();
  const newBlock = useNewBlock(t("plan.tab"));
  const [mode, setMode] = React.useState<"workout" | "exercise" | "block">("workout");
  const [picked, setPicked] = React.useState<Block | null>(null);
  const [start, setStart] = React.useState<CalendarDate>(today);
  const [busy, setBusy] = React.useState(false);
  const { state } = useLibrary();
  const blocks = usePlan(useApi()).state;
  const addTo = useAddTo(flow);
  const [text, setText] = React.useState("");
  // Plans there before it opened; anything since was added here, or from a preview it opened.
  const [before, setBefore] = React.useState<ReadonlySet<string>>(new Set());
  const [away, setAway] = React.useState(false);
  const [making, setMaking] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  if (visible !== open) {
    setOpen(visible);
    if (visible) {
      setBefore(new Set(addTo.plans.map((m) => m.id)));
      setMode("workout");
      setPicked(null);
    }
  }
  useFocusEffect(React.useCallback(() => setAway(false), []));

  const make = useMakeExercise();
  const world = usePickerWorld([], false);
  const save = useWorkoutActions(useApi(), failed).saveWorkout;
  const library = state.status === "ready" ? state.data : null;
  const workouts = library?.workouts ?? [];
  const ensure = useExerciseWorkout({ workouts, pick: pickWith(make), save, newId: randomUUID });
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
  const close = (): void => {
    setText("");
    onClose(added.map((m) => m.id));
  };
  const leave = (pathname: "/workout/[id]" | "/workout/edit", params: Record<string, string>) => {
    setAway(true);
    router.push({ pathname, params: { ...params, ...addFlowParams(flow), add: "1" } });
  };
  const openEntry = ({ source }: PickerEntry): void => {
    setAway(true);
    if ("grip" in source) router.push({ pathname: "/grip/[id]", params: { id: source.grip.id } });
    else
      router.push({
        pathname: "/exercise/[id]",
        params: { id: "exercise" in source ? source.exercise.id : source.builtIn.id },
      });
  };
  const newExercise = (kind: WorkoutKind): void => {
    setAway(true);
    openExerciseEditor(kind, "", (form) => {
      void make(form).then((made) => (made === null ? undefined : addEntry(entryOf(made))));
    });
  };
  const thereLabel =
    flow.date !== null
      ? t("plan.onDay")
      : flow.blockId === null
        ? t("plan.ongoing")
        : t("plan.inBlock");
  const pick = (b: Block): void => {
    setPicked(b);
    const day = flow.date ?? today;
    setStart(day < today ? today : day);
  };
  const schedule = async (b: Block): Promise<void> => {
    setBusy(true);
    const id = randomUUID();
    const made = await actions.copyBlock(b.id, id, start);
    setBusy(false);
    if (!made) return;
    prompt();
    close();
    onScheduled?.({ id, name: blockName(b), start });
  };
  const footer =
    picked !== null ? (
      <Button
        label={t("plan.scheduleFrom", { day: shortDate(start) })}
        onPress={() => void schedule(picked)}
        disabled={busy}
        variant="primary"
        height={50}
      />
    ) : mode === "block" ? (
      <Button
        label={t("plan.newBlock")}
        onPress={() => {
          close();
          newBlock();
        }}
        variant="primary"
        icon="plus"
        height={50}
      />
    ) : (
      <Button
        label={mode === "exercise" ? t("workouts.newExercise") : t("workouts.newWorkout")}
        onPress={() => setMaking(true)}
        variant="primary"
        icon="plus"
        height={50}
      />
    );
  const kicker = addKicker(flow, blocks.status === "ready" ? blocks.data.blocks : []);

  return (
    <>
      <HangSheet
        visible={visible && !away && !making}
        onClose={close}
        closeLabel={t("common.done")}
        footer={footer}
      >
        <View style={{ gap: 12, paddingBottom: 12 }}>
          {picked !== null ? (
            <SheetHeader
              kicker={blockName(picked)}
              title={t("plan.planAgainStart")}
              action={t("common.cancel")}
              onAction={close}
              onBack={() => setPicked(null)}
            />
          ) : (
            <SheetHeader
              kicker={kicker}
              title={onScheduled === undefined ? addTitle(flow) : t("plan.schedule")}
              action={t("common.done")}
              onAction={close}
            />
          )}
          {picked === null && (
            <Segmented
              value={mode}
              onChange={setMode}
              height={36}
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
          )}
          {picked !== null ? (
            <PlanAgainStart block={picked} start={start} onPick={setStart} />
          ) : mode === "block" ? (
            <ScheduleBlocks onPick={pick} />
          ) : mode === "exercise" ? (
            <>
              <LibrarySearch
                value={text}
                onChange={setText}
                placeholder={t("workouts.searchExercises")}
              />
              {entryShelves(world, text).map((shelf) => (
                <View key={shelf.kind} style={{ gap: 2 }}>
                  <Label color={colors.textSecondary}>{kindLabel(shelf.kind)}</Label>
                  {shelf.entries.map((e) => {
                    const mine = wrapperOf(workouts, e)?.id;
                    const using = workoutsWith(workouts, e);
                    const now = stateOf(
                      mine,
                      using.map((w) => w.id)
                    );
                    return (
                      <AddWorkoutRow
                        key={e.key}
                        kind={e.kind}
                        name={e.name}
                        meta={usedInText(using.length)}
                        picture={sourcePictures(e.source)[0]}
                        state={now}
                        thereLabel={thereLabel}
                        onOpen={() => openEntry(e)}
                        onToggle={() => (now === "added" ? undo(mine) : void addEntry(e))}
                      />
                    );
                  })}
                </View>
              ))}
            </>
          ) : (
            <>
              <LibrarySearch value={text} onChange={setText} />
              {library !== null && shelves.length === 0 && (
                <DashedPanel title={t("workouts.noResultsTitle")} body={t("workouts.noResults")} />
              )}
              {shelves.map((shelf) => (
                <View key={shelf.focus ?? "general"} style={{ gap: 2 }}>
                  <Label color={colors.textSecondary}>{focusLabel(shelf.focus)}</Label>
                  {shelf.workouts.map((w) => {
                    const now = stateOf(w.id, [w.id]);
                    return (
                      <AddWorkoutRow
                        key={w.id}
                        kind={w.kind}
                        name={w.name}
                        meta={libraryLine(w, model.settings.units)}
                        picture={libraryPictures("workout", w.id)[0]}
                        state={now}
                        thereLabel={thereLabel}
                        onOpen={() => leave("/workout/[id]", { id: w.id })}
                        onToggle={() => (now === "added" ? undo(w.id) : void addTo.add(w.id))}
                      />
                    );
                  })}
                </View>
              ))}
            </>
          )}
        </View>
      </HangSheet>
      {making && (
        <NewWorkoutSheet
          making={mode === "exercise" ? "exercise" : "workout"}
          onPick={(kind) =>
            mode === "exercise" ? newExercise(kind) : leave("/workout/edit", { kind })
          }
          onClose={() => setMaking(false)}
        />
      )}
    </>
  );
}
