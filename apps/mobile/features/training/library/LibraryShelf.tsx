import React from "react";
import { useExerciseList } from "@sendtally/features/exercises";
import { useApi } from "../../../lib/api";
import { View } from "react-native";
import { t } from "@sendtally/features/i18n";
import { libraryPictures } from "@sendtally/features/library";
import { focusLabel, focusMeaning } from "@sendtally/features/training";
import {
  libraryLine,
  type LibraryShelf as Shelf,
  type LibraryWorkout,
} from "@sendtally/features/workouts";
import { CategoryRow } from "../components/CategoryRow";
import { DashedPanel } from "../components/DashedPanel";
import { ShelfHeader } from "../components/ShelfHeader";
import { useHangData } from "../data/HangDataContext";
import type { RowPress } from "../useLockedRows";

/** How many workouts a focus shows before See all. */
export const SHELF_ROWS = 3;

export type LibraryShelfProps = {
  shelf: Shelf;
  /** How each workout's row presses: open, or locked. */
  press: (workout: LibraryWorkout) => RowPress;
  onSeeAll: () => void;
  /** Makes a new workout in the shelf's focus. */
  onAdd: () => void;
  addLocked: boolean;
};

/** One focus: its name, See all when it holds more than it shows, a plus, and its first workouts or what it trains. */
export function LibraryShelf({
  shelf,
  press,
  onSeeAll,
  onAdd,
  addLocked,
}: LibraryShelfProps): React.ReactElement {
  const { model } = useHangData();
  const exercises = useExerciseList(useApi());
  const label = focusLabel(shelf.focus);
  const more = shelf.workouts.length > SHELF_ROWS;
  return (
    <View style={{ gap: 2 }}>
      <ShelfHeader
        title={label}
        onSeeAll={more ? onSeeAll : undefined}
        count={shelf.workouts.length}
        addLabel={t("workouts.newWorkoutIn", { focus: label })}
        onAdd={onAdd}
        addLocked={addLocked}
      />
      {shelf.workouts.length === 0 && (
        <View style={{ marginTop: 8 }}>
          <DashedPanel body={focusMeaning(shelf.focus)} />
        </View>
      )}
      {shelf.workouts.slice(0, SHELF_ROWS).map((w) => (
        <CategoryRow
          key={w.id}
          kind={w.kind}
          name={w.name}
          meta={libraryLine(w, model.settings.units, exercises)}
          picture={libraryPictures("workout", w.id)[0]}
          {...press(w)}
        />
      ))}
    </View>
  );
}
