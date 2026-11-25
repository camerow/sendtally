import React from "react";
import type { Focus } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import { focusLabel, focusMeaning } from "@sendtally/features/training";
import { DetailFrame } from "../../components/detail/DetailFrame";
import { LoadState } from "../data/LoadState";
import { useLockedWorkouts } from "../useLockedRows";
import { LibraryBrowser } from "./LibraryBrowser";
import { WORKOUTS_VIEW, useLibrary, workoutPath } from "./useLibrary";

/** All of one focus's workouts, the user's own first, in a column to search. */
export function CategoryPage({ focus }: { focus: Focus | null }): React.ReactElement {
  const { state, reload } = useLibrary();
  const locked = useLockedWorkouts();
  return (
    <DetailFrame backTo={WORKOUTS_VIEW}>
      <div className="intro">
        <h1 className="train-title intro-title">{focusLabel(focus)}</h1>
        <p className="intro-body">{focusMeaning(focus)}</p>
      </div>
      {state.status === "ready" ? (
        <LibraryBrowser
          library={state.data}
          focus={focus}
          placeholder={t("focus.search", { focus: focusLabel(focus) })}
          link={(w) => locked.row(w, workoutPath(w.id))}
        />
      ) : (
        <LoadState state={state} onRetry={() => void reload()} />
      )}
      {locked.sheet}
    </DetailFrame>
  );
}
