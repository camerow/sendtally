import { randomUUID } from "expo-crypto";
import { router, useFocusEffect } from "expo-router";
import React from "react";
import { View } from "react-native";
import type { Block, CalendarDate } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { shortDate } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { focusLabel, usePlan, workoutLines, blockName } from "@sendtally/features/training";
import { libraryShelves, type LibraryWorkout } from "@sendtally/features/workouts";
import { useApi } from "../../../lib/api";
import { Button } from "../components/Button";
import { DashedPanel } from "../components/DashedPanel";
import { Label } from "../components/Label";
import { Segmented } from "../components/Segmented";
import { SheetHeader } from "../components/SheetHeader";
import { useHangData } from "../data/HangDataContext";
import { HangSheet } from "../data/HangSheet";
import { LibrarySearch } from "../library/LibrarySearch";
import { NewWorkoutSheet } from "../library/NewWorkoutSheet";
import { useLibrary } from "../library/useLibrary";
import { usePlanActions } from "../plan/usePlanActions";
import { useReminderPrompt } from "../reminders/ReminderPromptProvider";
import { AddWorkoutRow, type AddState } from "./AddWorkoutRow";
import { addFlowParams, addKicker, type AddFlow } from "@sendtally/features/training";
import { PlanAgainStart } from "./PlanAgainStart";
import { ScheduleBlocks } from "./ScheduleBlocks";
import { useAddTo } from "./useAddTo";
import { useNewBlock } from "./useNewBlock";

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
  const [mode, setMode] = React.useState<"workout" | "block">("workout");
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

  const library = state.status === "ready" ? state.data : null;
  const shelves = library === null ? [] : libraryShelves(library.workouts, library.usage, { text });
  const added = addTo.plans.filter((m) => !before.has(m.id));
  const stateOf = (w: LibraryWorkout): AddState =>
    added.some((m) => m.workoutId === w.id)
      ? "added"
      : addTo.plans.some((m) => m.workoutId === w.id)
        ? "there"
        : "none";
  const close = (): void => {
    setText("");
    onClose(added.map((m) => m.id));
  };
  const leave = (pathname: "/workout/[id]" | "/workout/edit", params: Record<string, string>) => {
    setAway(true);
    router.push({ pathname, params: { ...params, ...addFlowParams(flow), add: "1" } });
  };
  const doseOf = (w: LibraryWorkout): string | null => workoutLines(w, model)[0] ?? null;
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
        label={t("workouts.newWorkout")}
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
              title={onScheduled === undefined ? t("plan.addWorkouts") : t("plan.schedule")}
              action={t("common.done")}
              onAction={close}
            />
          )}
          {onScheduled !== undefined && picked === null && (
            <Segmented
              value={mode}
              onChange={setMode}
              height={36}
              options={[
                { value: "workout", label: t("plan.workout") },
                { value: "block", label: t("plan.block") },
              ]}
            />
          )}
          {picked !== null ? (
            <PlanAgainStart block={picked} start={start} onPick={setStart} />
          ) : mode === "block" ? (
            <ScheduleBlocks onPick={pick} />
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
                    const now = stateOf(w);
                    return (
                      <AddWorkoutRow
                        key={w.id}
                        workout={w}
                        dose={doseOf(w)}
                        state={now}
                        thereLabel={
                          flow.date !== null
                            ? t("plan.onDay")
                            : flow.blockId === null
                              ? t("plan.ongoing")
                              : t("plan.inBlock")
                        }
                        onOpen={() => leave("/workout/[id]", { id: w.id })}
                        onToggle={() =>
                          now === "added"
                            ? added
                                .filter((m) => m.workoutId === w.id)
                                .forEach((m) => addTo.undo(m.id))
                            : void addTo.add(w.id)
                        }
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
          making="workout"
          onPick={(kind) => leave("/workout/edit", { kind })}
          onClose={() => setMaking(false)}
        />
      )}
    </>
  );
}
