import { router } from "expo-router";
import React from "react";
import { View } from "react-native";
import type { Focus } from "@sendtally/core/hang";
import { focusParam } from "@sendtally/features/training";
import { libraryShelves, type LibraryWorkout } from "@sendtally/features/workouts";
import { HangDataProvider } from "../data/HangDataProvider";
import { LoadState } from "../data/LoadState";
import { LibraryBrowser } from "./LibraryBrowser";
import { LibraryShelf } from "./LibraryShelf";
import { NewWorkoutSheet } from "./NewWorkoutSheet";
import { useLibrary } from "./useLibrary";

const preview = (w: LibraryWorkout): void =>
  router.push({ pathname: "/workout/preview", params: { id: w.id } });

function Library(): React.ReactElement {
  const { state, reload } = useLibrary();
  const [adding, setAdding] = React.useState<{ focus: Focus | null } | null>(null);
  return (
    <View style={{ gap: 14 }}>
      {state.status === "ready" ? (
        <LibraryBrowser library={state.data} onPick={preview}>
          {libraryShelves(state.data.workouts, state.data.usage).map((shelf) => (
            <LibraryShelf
              key={focusParam(shelf.focus)}
              shelf={shelf}
              usage={state.data.usage}
              onPick={preview}
              onSeeAll={() =>
                router.push({
                  pathname: "/workout/category",
                  params: { focus: focusParam(shelf.focus) },
                })
              }
              onAdd={() => setAdding({ focus: shelf.focus })}
              gutter={18}
            />
          ))}
        </LibraryBrowser>
      ) : (
        <LoadState state={state} onRetry={() => void reload()} />
      )}
      {adding !== null && (
        <NewWorkoutSheet
          making="workout"
          onPick={(kind) =>
            router.push({
              pathname: "/workout/edit",
              params: { kind, focus: focusParam(adding.focus) },
            })
          }
          onClose={() => setAdding(null)}
        />
      )}
    </View>
  );
}

/**
 * Every workout, built in and the user's own, on one sideways shelf per focus, to search,
 * open, see a focus whole, or make a new one in it. It lays out as a plain column for the
 * host screen's own scroll view and loads its own data.
 */
export function WorkoutLibrary(): React.ReactElement {
  return (
    <HangDataProvider>
      <Library />
    </HangDataProvider>
  );
}
