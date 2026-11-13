import React from "react";
import { Link } from "react-router";
import { t } from "@sendtally/features/i18n";
import { focusLabel, focusMeaning, focusParam, workoutLines } from "@sendtally/features/training";
import type { LibraryShelf as Shelf } from "@sendtally/features/workouts";
import { Icon } from "../../components/Icon";
import { CategoryRow } from "../components/CategoryRow";
import { DashedPanel } from "../components/DashedPanel";
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
      {count > SHELF_ROWS ? (
        <Link
          to={`/app/train/${focusParam(shelf.focus)}`}
          className="shelf-head shelf-head--link"
          aria-label={t("workouts.seeAllOf", { kind: label })}
        >
          <h2 className="train-title shelf-title">{label}</h2>
          <span className="train-label shelf-see-all">
            {t("workouts.seeAllCount", { n: count })}
            <Icon name="chevron" size={14} strokeWidth={2.2} />
          </span>
        </Link>
      ) : (
        <div className="shelf-head">
          <h2 className="train-title shelf-title">{label}</h2>
        </div>
      )}
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
