import React from "react";
import { focusParam } from "@sendtally/features/training";
import { libraryShelves } from "@sendtally/features/workouts";
import { LoadState } from "../data/LoadState";
import { LibraryBrowser } from "./LibraryBrowser";
import { LibraryShelf } from "./LibraryShelf";
import { useLibrary } from "./useLibrary";

/** Every workout, built in and the user's own, listed by focus, to search, open, or see a focus whole. */
export function WorkoutLibrary(): React.ReactElement {
  const { state, reload } = useLibrary();
  if (state.status !== "ready") return <LoadState state={state} onRetry={() => void reload()} />;
  return (
    <LibraryBrowser library={state.data}>
      <div className="library-shelves">
        {libraryShelves(state.data.workouts, state.data.usage, { empty: true }).map((shelf) => (
          <LibraryShelf key={focusParam(shelf.focus)} shelf={shelf} />
        ))}
      </div>
    </LibraryBrowser>
  );
}
