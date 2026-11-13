import React from "react";
import { useNavigate } from "react-router";
import type { Focus } from "@sendtally/core/hang";
import { CategorySheet } from "../editor/CategorySheet";
import { newWorkoutPath } from "../editor/paths";
import { focusParam } from "@sendtally/features/training";
import { libraryShelves } from "@sendtally/features/workouts";
import { LoadState } from "../data/LoadState";
import { LibraryBrowser } from "./LibraryBrowser";
import { LibraryShelf } from "./LibraryShelf";
import { useLibrary } from "./useLibrary";

/** Every workout, built in and the user's own, listed by focus, to search, open, or see a focus whole. */
export function WorkoutLibrary(): React.ReactElement {
  const { state, reload } = useLibrary();
  const navigate = useNavigate();
  const [adding, setAdding] = React.useState<{ focus: Focus | null } | null>(null);
  if (state.status !== "ready") return <LoadState state={state} onRetry={() => void reload()} />;
  return (
    <LibraryBrowser library={state.data}>
      <div className="library-shelves">
        {libraryShelves(state.data.workouts, state.data.usage, { empty: true }).map((shelf) => (
          <LibraryShelf
            key={focusParam(shelf.focus)}
            shelf={shelf}
            onAdd={() => setAdding({ focus: shelf.focus })}
          />
        ))}
      </div>
      {adding !== null && (
        <CategorySheet
          making="workout"
          onPick={(kind) => void navigate(newWorkoutPath(kind, adding.focus))}
          onClose={() => setAdding(null)}
        />
      )}
    </LibraryBrowser>
  );
}
