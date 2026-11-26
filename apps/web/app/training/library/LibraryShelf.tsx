import React from "react";
import { useExerciseList } from "@sendtally/features/exercises";
import { useAppApi } from "../../lib/useAppApi";
import { t } from "@sendtally/features/i18n";
import { libraryPictures } from "@sendtally/features/library";
import { focusLabel, focusMeaning, focusParam } from "@sendtally/features/training";
import {
  libraryLine,
  type LibraryShelf as Shelf,
  type LibraryWorkout,
} from "@sendtally/features/workouts";
import { CategoryRow } from "../components/CategoryRow";
import { DashedPanel } from "../components/DashedPanel";
import { ShelfHeader } from "../components/ShelfHeader";
import { useHangData } from "../data/HangDataContext";
import type { RowLink } from "../useLockedRows";

/** How many workouts a focus shows before See all. */
export const SHELF_ROWS = 3;

/** One focus: its name, See all when it holds more than it shows, and its first workouts or what it trains. */
export function LibraryShelf({
  shelf,
  link,
  onAdd,
  addLocked,
}: {
  shelf: Shelf;
  /** Where each workout's row goes: its page, or locked, the Membership page. */
  link: (workout: LibraryWorkout) => RowLink;
  /** Makes a new workout in the shelf's focus. */
  onAdd: () => void;
  addLocked: boolean;
}): React.ReactElement {
  const { model } = useHangData();
  const exercises = useExerciseList(useAppApi());
  const label = focusLabel(shelf.focus);
  const count = shelf.workouts.length;
  return (
    <section className="library-shelf">
      <ShelfHeader
        title={label}
        add={{
          label: t("workouts.newWorkoutIn", { focus: label }),
          onPress: onAdd,
          locked: addLocked,
        }}
        seeAll={
          count > SHELF_ROWS ? { to: `/app/train/${focusParam(shelf.focus)}`, count } : undefined
        }
      />
      {count === 0 && <DashedPanel body={focusMeaning(shelf.focus)} />}
      {shelf.workouts.slice(0, SHELF_ROWS).map((w) => (
        <CategoryRow
          key={w.id}
          kind={w.kind}
          name={w.name}
          meta={libraryLine(w, model.settings.units, exercises)}
          picture={libraryPictures("workout", w.id)[0]}
          {...link(w)}
        />
      ))}
    </section>
  );
}
