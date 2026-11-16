import React from "react";
import type { LibraryPicture, WorkoutKind } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import { Icon } from "../../components/Icon";
import { CategoryRow } from "../components/CategoryRow";

/** Where it stands: addable, just added here, or already there. */
export type AddState = "none" | "added" | "there";

export type AddWorkoutRowProps = {
  kind: WorkoutKind;
  name: string;
  meta: string | null;
  /** The built-in's first picture, as its tile. */
  picture?: LibraryPicture;
  to: string;
  state: AddState;
  thereLabel: string;
  onAdd: () => void;
  onUndo: () => void;
};

/** A workout or exercise to add: its row, opening it, with + to add it or Added to take it back. */
export function AddWorkoutRow({
  kind,
  name,
  meta,
  picture,
  to,
  state,
  thereLabel,
  onAdd,
  onUndo,
}: AddWorkoutRowProps): React.ReactElement {
  return (
    <div className="add-row">
      <div className="add-row-main">
        <CategoryRow kind={kind} name={name} meta={meta} picture={picture} to={to} />
      </div>
      {state === "there" ? (
        <span className="add-row-there">{thereLabel}</span>
      ) : state === "added" ? (
        <button
          type="button"
          className="add-row-added"
          aria-label={t("plan.undoAdd", { name })}
          onClick={onUndo}
        >
          <Icon name="check" size={16} strokeWidth={2.5} />
          {t("plan.added")}
        </button>
      ) : (
        <button
          type="button"
          className="add-row-add"
          aria-label={t("plan.addNamed", { name })}
          onClick={onAdd}
        >
          <Icon name="plus" size={18} strokeWidth={2.4} />
        </button>
      )}
    </div>
  );
}
