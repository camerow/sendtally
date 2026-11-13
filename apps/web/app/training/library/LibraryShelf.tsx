import React from "react";
import { focusLabel, focusMeaning, focusParam, workoutLines } from "@sendtally/features/training";
import type { LibraryShelf as Shelf } from "@sendtally/features/workouts";
import { CategoryRow } from "../components/CategoryRow";
import { DashedPanel } from "../components/DashedPanel";
import { ShelfHeader } from "../components/ShelfHeader";
import { useHangData } from "../data/HangDataContext";
import { workoutPath } from "./useLibrary";

/** How many workouts a focus shows before See all. */
export const SHELF_ROWS = 3;

/** One focus: its name, See all when it holds more than it shows, and its first workouts or what it trains. */
export function LibraryShelf({ shelf }: { shelf: Shelf }): React.ReactElement {
  const { model } = useHangData();
  const label = focusLabel(shelf.focus);
  const count = shelf.workouts.length;
  return (
    <section className="library-shelf">
      <ShelfHeader
        title={label}
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
          meta={workoutLines(w, model)[0] ?? null}
          to={workoutPath(w.id)}
        />
      ))}
    </section>
  );
}
