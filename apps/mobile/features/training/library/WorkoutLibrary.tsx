import { router } from "expo-router";
import React from "react";
import { View } from "react-native";
import { focusParam } from "@sendtally/features/training";
import { libraryShelves, type LibraryWorkout } from "@sendtally/features/workouts";
import { HangDataProvider } from "../data/HangDataProvider";
import { LoadState } from "../data/LoadState";
import { openMembershipPage, useLocks } from "../locks";
import { useLockedWorkouts } from "../useLockedRows";
import { LibraryBrowser } from "./LibraryBrowser";
import { LibraryShelf } from "./LibraryShelf";
import { useLibrary } from "./useLibrary";

const open = (w: LibraryWorkout): void =>
  router.push({ pathname: "/workout/[id]", params: { id: w.id } });

function Library(): React.ReactElement {
  const { state, reload } = useLibrary();
  const locked = useLockedWorkouts();
  const create = useLocks().create;
  const press = (w: LibraryWorkout) => locked.row(w, () => open(w));
  return (
    <View style={{ gap: 14 }}>
      {state.status === "ready" ? (
        <LibraryBrowser library={state.data} press={press}>
          {libraryShelves(state.data.workouts, state.data.usage, { empty: true }).map((shelf) => (
            <LibraryShelf
              key={focusParam(shelf.focus)}
              shelf={shelf}
              press={press}
              onSeeAll={() =>
                router.push({
                  pathname: "/workout/category",
                  params: { focus: focusParam(shelf.focus) },
                })
              }
              onAdd={() =>
                create
                  ? openMembershipPage("create")
                  : router.push({
                      pathname: "/workout/edit",
                      params: { focus: focusParam(shelf.focus) },
                    })
              }
              addLocked={create}
            />
          ))}
        </LibraryBrowser>
      ) : (
        <LoadState state={state} onRetry={() => void reload()} />
      )}
      {locked.sheet}
    </View>
  );
}

/**
 * Every workout, built in and the user's own, listed by focus, to search,
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
