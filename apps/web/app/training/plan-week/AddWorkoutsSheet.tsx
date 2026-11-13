import React from "react";
import type { Block, CalendarDate } from "@sendtally/core/hang";
import { shortDate } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import {
  addKicker,
  focusLabel,
  useAddTo,
  useTrainingLog,
  workoutLines,
  type AddFlow,
} from "@sendtally/features/training";
import { libraryShelves, type LibraryWorkout } from "@sendtally/features/workouts";
import { Icon } from "../../components/Icon";
import { Segmented } from "../../components/Segmented";
import { Sheet, type SheetAction } from "../../components/Sheet";
import { useAppApi } from "../../lib/useAppApi";
import { CategoryRow } from "../components/CategoryRow";
import { DashedPanel } from "../components/DashedPanel";
import { useHangData } from "../data/HangDataContext";
import { usePlanActions } from "../data/usePlanActions";
import { useLibrary, workoutPath } from "../library/useLibrary";
import { PlanAgainStart } from "../blocks/PlanAgainStart";
import { ScheduleBlocks } from "../blocks/ScheduleBlocks";
import { useNewBlock } from "../blocks/useNewBlock";

/** Where the workout stands: addable, just added here, or already on the day. */
type AddState = "none" | "added" | "there";

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
  const api = useAppApi();
  const actions = usePlanActions();
  const { plan } = useTrainingLog(api).log;
  const newBlock = useNewBlock();
  const addTo = useAddTo(api, flow, today, { newId: () => crypto.randomUUID(), actions });
  const [mode, setMode] = React.useState<"workout" | "block">("workout");
  const [picked, setPicked] = React.useState<Block | null>(null);
  const [start, setStart] = React.useState<CalendarDate>(today);
  const [busy, setBusy] = React.useState(false);
  const { state } = useLibrary();
  const [text, setText] = React.useState("");
  // Plans there before it opened; anything since was added here.
  const [before] = React.useState<ReadonlySet<string>>(() => new Set(addTo.plans.map((m) => m.id)));
  const library = state.status === "ready" ? state.data : null;
  const shelves = library === null ? [] : libraryShelves(library.workouts, library.usage, { text });
  const added = addTo.plans.filter((m) => !before.has(m.id));
  const stateOf = (w: LibraryWorkout): AddState =>
    added.some((m) => m.workoutId === w.id)
      ? "added"
      : addTo.plans.some((m) => m.workoutId === w.id)
        ? "there"
        : "none";
  const close = (): void => onClose(added.map((m) => m.id));
  const pick = (b: Block): void => {
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
    onScheduled?.({ id, name: b.name || t("plan.untitled"), start });
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
        kicker={picked.name || t("plan.untitled")}
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
      title={onScheduled === undefined ? t("plan.addWorkouts") : t("plan.schedule")}
      onClose={close}
      cancel={mode === "block"}
      action={action}
    >
      {onScheduled !== undefined && (
        <Segmented
          label={t("plan.schedule")}
          value={mode}
          onChange={setMode}
          options={[
            { value: "workout", label: t("plan.workout") },
            { value: "block", label: t("plan.block") },
          ]}
        />
      )}
      {mode === "block" ? (
        <ScheduleBlocks onPick={pick} />
      ) : (
        <>
          <input
            type="search"
            className="library-search"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t("workouts.search")}
            aria-label={t("workouts.search")}
            autoComplete="off"
            maxLength={80}
          />
          <div className="add-shelves">
            {library !== null && shelves.length === 0 && (
              <DashedPanel title={t("workouts.noResultsTitle")} body={t("workouts.noResults")} />
            )}
            {shelves.map((shelf) => (
              <section key={shelf.focus ?? "general"} className="add-shelf">
                <h3 className="plan-label plan-label--muted">{focusLabel(shelf.focus)}</h3>
                {shelf.workouts.map((w) => {
                  const now = stateOf(w);
                  return (
                    <div key={w.id} className="add-row">
                      <div className="add-row-main">
                        <CategoryRow
                          kind={w.kind}
                          name={w.name}
                          meta={workoutLines(w, model)[0] ?? null}
                          to={workoutPath(w.id)}
                        />
                      </div>
                      {now === "there" ? (
                        <span className="add-row-there">{thereLabel}</span>
                      ) : now === "added" ? (
                        <button
                          type="button"
                          className="add-row-added"
                          aria-label={t("plan.undoAdd", { name: w.name })}
                          onClick={() =>
                            added
                              .filter((m) => m.workoutId === w.id)
                              .forEach((m) => addTo.undo(m.id))
                          }
                        >
                          <Icon name="check" size={16} strokeWidth={2.5} />
                          {t("plan.added")}
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="add-row-add"
                          aria-label={t("plan.addNamed", { name: w.name })}
                          onClick={() => void addTo.add(w.id)}
                        >
                          <Icon name="plus" size={18} strokeWidth={2.4} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </section>
            ))}
          </div>
        </>
      )}
    </Sheet>
  );
}
