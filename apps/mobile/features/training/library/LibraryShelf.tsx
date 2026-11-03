import React from "react";
import { View } from "react-native";
import { t } from "@sendtally/features/i18n";
import { focusLabel } from "@sendtally/features/training";
import type { LibraryShelf as Shelf, LibraryWorkout } from "@sendtally/features/workouts";
import { CategoryRow } from "../components/CategoryRow";
import { ShelfHeader } from "../components/ShelfHeader";
import { useHangData } from "../data/HangDataContext";
import { workoutLines } from "../plan/planGridRows";

/** How many workouts a focus shows before See all. */
export const SHELF_ROWS = 3;

export type LibraryShelfProps = {
  shelf: Shelf;
  onPick: (workout: LibraryWorkout) => void;
  onSeeAll: () => void;
  /** Makes a new workout in the shelf's focus. */
  onAdd: () => void;
};

/** One focus: its name, See all when it holds more than it shows, a plus, and its first workouts. */
export function LibraryShelf({
  shelf,
  onPick,
  onSeeAll,
  onAdd,
}: LibraryShelfProps): React.ReactElement {
  const { model } = useHangData();
  const label = focusLabel(shelf.focus);
  const more = shelf.workouts.length > SHELF_ROWS;
  return (
    <View style={{ gap: 2 }}>
      <ShelfHeader
        title={label}
        muted={shelf.focus === null}
        onSeeAll={more ? onSeeAll : undefined}
        count={shelf.workouts.length}
        addLabel={t("workouts.newWorkoutIn", { focus: label })}
        onAdd={onAdd}
      />
      {shelf.workouts.slice(0, SHELF_ROWS).map((w) => (
        <CategoryRow
          key={w.id}
          kind={w.kind}
          name={w.name}
          meta={workoutLines(w, model)[0] ?? null}
          onPress={() => onPick(w)}
        />
      ))}
    </View>
  );
}
