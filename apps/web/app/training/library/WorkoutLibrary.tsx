import React from "react";
import { useNavigate } from "react-router";
import { newWorkoutPath } from "../editor/paths";
import { focusParam } from "@sendtally/features/training";
import { libraryShelves, type LibraryWorkout } from "@sendtally/features/workouts";
import { LoadState } from "../data/LoadState";
import { joinPath, useLocks } from "../locks";
import { useLockedWorkouts } from "../useLockedRows";
import { LibraryBrowser } from "./LibraryBrowser";
import { LibraryShelf } from "./LibraryShelf";
import { useLibrary, workoutPath } from "./useLibrary";

/** Every workout, built in and the user's own, listed by focus, to search, open, or see a focus whole. */
export function WorkoutLibrary(): React.ReactElement {
  const { state, reload } = useLibrary();
  const navigate = useNavigate();
  const locked = useLockedWorkouts();
  const create = useLocks().create;
  const link = (w: LibraryWorkout) => locked.row(w, workoutPath(w.id));
  if (state.status !== "ready") return <LoadState state={state} onRetry={() => void reload()} />;
  return (
    <LibraryBrowser library={state.data} link={link}>
      <div className="library-shelves">
        {libraryShelves(state.data.workouts, state.data.usage, { empty: true }).map((shelf) => (
          <LibraryShelf
            key={focusParam(shelf.focus)}
            shelf={shelf}
            link={link}
            onAdd={() => void navigate(create ? joinPath("create") : newWorkoutPath(shelf.focus))}
            addLocked={create}
          />
        ))}
      </div>
      {locked.sheet}
    </LibraryBrowser>
  );
}
