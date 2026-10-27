import { router } from "expo-router";
import React from "react";
import type { WorkoutKind } from "@sendtally/core/hang";
import { kindLabel } from "@sendtally/features/activities";
import { Title } from "../components/Title";
import { LoadState } from "../data/LoadState";
import { ScreenFrame } from "../planning/ScreenFrame";
import { LibraryBrowser } from "./LibraryBrowser";
import { useLibrary } from "./useLibrary";

export type CategoryScreenProps = { kind: WorkoutKind };

/** All of one category's workouts, the user's own first, in a column to search. */
export function CategoryScreen({ kind }: CategoryScreenProps): React.ReactElement {
  const { state, reload } = useLibrary();
  return (
    <ScreenFrame>
      <Title size={34}>{kindLabel(kind)}</Title>
      {state.status === "ready" ? (
        <LibraryBrowser
          library={state.data}
          kinds={[kind]}
          onPick={(w) => router.push({ pathname: "/workout/preview", params: { id: w.id } })}
        />
      ) : (
        <LoadState state={state} onRetry={() => void reload()} />
      )}
    </ScreenFrame>
  );
}
