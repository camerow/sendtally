import { router } from "expo-router";
import React from "react";
import { View } from "react-native";
import { t } from "@sendtally/features/i18n";
import { libraryShelves, type LibraryWorkout } from "@sendtally/features/workouts";
import { Button } from "../components/Button";
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
  const [adding, setAdding] = React.useState(false);
  return (
    <View style={{ gap: 14 }}>
      <Button
        label={t("workouts.newWorkout")}
        onPress={() => setAdding(true)}
        variant="dashed"
        icon="plus"
        height={50}
      />
      {state.status === "ready" ? (
        <LibraryBrowser library={state.data} onPick={preview}>
          {libraryShelves(state.data.workouts, state.data.usage).map((shelf) => (
            <LibraryShelf
              key={shelf.kind}
              shelf={shelf}
              usage={state.data.usage}
              onPick={preview}
              onSeeAll={() =>
                router.push({ pathname: "/workout/category", params: { kind: shelf.kind } })
              }
              gutter={18}
            />
          ))}
        </LibraryBrowser>
      ) : (
        <LoadState state={state} onRetry={() => void reload()} />
      )}
      {adding && <NewWorkoutSheet onClose={() => setAdding(false)} />}
    </View>
  );
}

/**
 * Every workout, built in and the user's own, on one sideways shelf per category, to
 * search, open, or see a category whole. It lays out as a plain column for the host screen's own scroll view and loads its own data.
 */
export function WorkoutLibrary(): React.ReactElement {
  return (
    <HangDataProvider>
      <Library />
    </HangDataProvider>
  );
}
