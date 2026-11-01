import { router, useFocusEffect } from "expo-router";
import React from "react";
import { View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { focusLabel, usePlan } from "@sendtally/features/training";
import { libraryShelves, type LibraryWorkout } from "@sendtally/features/workouts";
import { useApi } from "../../../lib/api";
import { Button } from "../components/Button";
import { DashedPanel } from "../components/DashedPanel";
import { Label } from "../components/Label";
import { SheetHeader } from "../components/SheetHeader";
import { useHangData } from "../data/HangDataContext";
import { HangSheet } from "../data/HangSheet";
import { LibrarySearch } from "../library/LibrarySearch";
import { NewWorkoutSheet } from "../library/NewWorkoutSheet";
import { useLibrary } from "../library/useLibrary";
import { workoutLines } from "../plan/planGridRows";
import { AddWorkoutRow, type AddState } from "./AddWorkoutRow";
import { addFlowParams, addKicker, type AddFlow } from "./flowParams";
import { useAddTo } from "./useAddTo";

export type AddWorkoutsSheetProps = {
  flow: AddFlow;
  visible: boolean;
  /** Closed with the plans added while it was open. */
  onClose: (added: readonly string[]) => void;
};

/**
 * Adding workouts to a block or a day: every workout under its focus, searched across all of
 * them, each added with + and taken back with a second tap, the sheet staying open for more.
 */
export function AddWorkoutsSheet({
  flow,
  visible,
  onClose,
}: AddWorkoutsSheetProps): React.ReactElement {
  const { model } = useHangData();
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
    if (visible) setBefore(new Set(addTo.plans.map((m) => m.id)));
  }
  useFocusEffect(React.useCallback(() => setAway(false), []));

  const library = state.status === "ready" ? state.data : null;
  const shelves = library === null ? [] : libraryShelves(library.workouts, library.usage, text);
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

  return (
    <>
      <HangSheet
        visible={visible && !away && !making}
        onClose={close}
        closeLabel={t("common.done")}
        footer={
          <Button
            label={t("workouts.newWorkout")}
            onPress={() => setMaking(true)}
            variant="primary"
            icon="plus"
            height={50}
          />
        }
      >
        <View style={{ gap: 12, paddingBottom: 12 }}>
          <SheetHeader
            kicker={addKicker(flow, blocks.status === "ready" ? blocks.data.blocks : [])}
            title={t("plan.addWorkouts")}
            action={t("common.done")}
            onAction={close}
          />
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
                    thereLabel={flow.date !== null ? t("plan.onDay") : t("plan.inBlock")}
                    onOpen={() => leave("/workout/[id]", { id: w.id })}
                    onToggle={() =>
                      now === "added"
                        ? added.filter((m) => m.workoutId === w.id).forEach((m) => addTo.undo(m.id))
                        : void addTo.add(w.id)
                    }
                  />
                );
              })}
            </View>
          ))}
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
