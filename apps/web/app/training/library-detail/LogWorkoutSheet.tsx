import React from "react";
import { t } from "@sendtally/features/i18n";
import { focusLabel, workoutLines } from "@sendtally/features/training";
import { libraryShelves } from "@sendtally/features/workouts";
import { Sheet } from "../../components/Sheet";
import { CategoryRow } from "../components/CategoryRow";
import { DashedPanel } from "../components/DashedPanel";
import { useHangData } from "../data/HangDataContext";
import { HangDataProvider } from "../data/HangDataProvider";
import { useLibrary } from "../library/useLibrary";
import { logLink } from "../log/logLink";

function Picker(): React.ReactElement {
  const { model, today } = useHangData();
  const { state } = useLibrary();
  const [text, setText] = React.useState("");
  const library = state.status === "ready" ? state.data : null;
  const shelves = library === null ? [] : libraryShelves(library.workouts, library.usage, { text });
  return (
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
        autoFocus
      />
      {library !== null && shelves.length === 0 && (
        <DashedPanel title={t("workouts.noResultsTitle")} body={t("workouts.noResults")} />
      )}
      {library !== null &&
        shelves.map((shelf) => (
          <div key={shelf.focus ?? "general"} className="log-workout-shelf">
            <span className="field-label">{focusLabel(shelf.focus)}</span>
            {shelf.workouts.map((w) => {
              const to = logLink(w, today, library.usage.get(w.id)?.count ?? 0);
              return to === null ? null : (
                <CategoryRow
                  key={w.id}
                  kind={w.kind}
                  name={w.name}
                  meta={workoutLines(w, model)[0] ?? null}
                  to={to}
                />
              );
            })}
          </div>
        ))}
    </>
  );
}

/** Log a workout from the empty log: every workout under its focus, each opening its review. */
export function LogWorkoutSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}): React.ReactElement {
  return (
    <Sheet
      open={open}
      kicker={t("statistics.training")}
      title={t("training.logWorkout")}
      onClose={onClose}
    >
      <div className="log-workout-sheet">
        <HangDataProvider fallback={null}>
          <Picker />
        </HangDataProvider>
      </div>
    </Sheet>
  );
}
