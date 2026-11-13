import React from "react";
import type { CalendarDate } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import { addKicker, focusLabel, useAddTo, workoutLines } from "@sendtally/features/training";
import { libraryShelves, type LibraryWorkout } from "@sendtally/features/workouts";
import { Icon } from "../../components/Icon";
import { Sheet } from "../../components/Sheet";
import { useAppApi } from "../../lib/useAppApi";
import { CategoryRow } from "../components/CategoryRow";
import { DashedPanel } from "../components/DashedPanel";
import { useHangData } from "../data/HangDataContext";
import { usePlanActions } from "../data/usePlanActions";
import { useLibrary, workoutPath } from "../library/useLibrary";

/** Where the workout stands: addable, just added here, or already on the day. */
type AddState = "none" | "added" | "there";

export type AddWorkoutsSheetProps = {
  date: CalendarDate;
  /** Closed with the plans added while it was open. */
  onClose: (added: readonly string[]) => void;
};

/**
 * Scheduling workouts on a day: every workout under its focus, searched across all of them,
 * each added with + and taken back with a second click, the sheet staying open for more.
 */
export function AddWorkoutsSheet({ date, onClose }: AddWorkoutsSheetProps): React.ReactElement {
  const { model, today } = useHangData();
  const flow = { date, blockId: null };
  const addTo = useAddTo(useAppApi(), flow, today, {
    newId: () => crypto.randomUUID(),
    actions: usePlanActions(),
  });
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

  return (
    <Sheet
      open
      kicker={addKicker(flow, [])}
      title={t("plan.schedule")}
      onClose={close}
      cancel={false}
      action={{ label: t("common.done"), onPress: close }}
    >
      <input
        type="search"
        className="library-search"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t("workouts.search")}
        aria-label={t("workouts.search")}
        autoComplete="off"
        maxLength={80}
        data-autofocus
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
                    <span className="add-row-there">{t("plan.onDay")}</span>
                  ) : now === "added" ? (
                    <button
                      type="button"
                      className="add-row-added"
                      aria-label={t("plan.undoAdd", { name: w.name })}
                      onClick={() =>
                        added.filter((m) => m.workoutId === w.id).forEach((m) => addTo.undo(m.id))
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
    </Sheet>
  );
}
