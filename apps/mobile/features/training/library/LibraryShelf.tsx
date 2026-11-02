import React from "react";
import { ScrollView, View } from "react-native";
import { t } from "@sendtally/features/i18n";
import { focusLabel } from "@sendtally/features/training";
import type {
  LibraryShelf as Shelf,
  LibraryWorkout,
  WorkoutUse,
} from "@sendtally/features/workouts";
import { ShelfHeader } from "../components/ShelfHeader";
import { LibraryCard } from "./LibraryCard";

export type LibraryShelfProps = {
  shelf: Shelf;
  usage: ReadonlyMap<string, WorkoutUse>;
  onPick: (workout: LibraryWorkout) => void;
  onSeeAll: () => void;
  /** Makes a new workout in the shelf's focus. */
  onAdd: () => void;
  /** The host column's side padding, which the row bleeds through to the screen's edges. */
  gutter: number;
};

/** One focus: its name, which opens all of it, and a plus, over a sideways row of its workouts. */
export function LibraryShelf({
  shelf,
  usage,
  onPick,
  onSeeAll,
  onAdd,
  gutter,
}: LibraryShelfProps): React.ReactElement {
  const label = focusLabel(shelf.focus);
  return (
    <View style={{ gap: 10 }}>
      <ShelfHeader
        title={label}
        muted={shelf.focus === null}
        onSeeAll={onSeeAll}
        addLabel={t("workouts.newWorkoutIn", { focus: label })}
        onAdd={onAdd}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginHorizontal: -gutter }}
        contentContainerStyle={{ gap: 12, paddingHorizontal: gutter }}
      >
        {shelf.workouts.map((w) => (
          <LibraryCard
            key={w.id}
            workout={w}
            use={usage.get(w.id)}
            width={264}
            onPress={() => onPick(w)}
          />
        ))}
      </ScrollView>
    </View>
  );
}
