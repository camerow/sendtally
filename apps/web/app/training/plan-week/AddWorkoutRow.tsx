import React from "react";
import type { LibraryPicture, WorkoutKind } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import { Icon } from "../../components/Icon";
import { Lock } from "../../components/Lock";
import { CategoryRow } from "../components/CategoryRow";

/** Where it stands: addable, just added here, or already there. */
export type AddState = "none" | "added" | "there";

export type AddWorkoutRowProps = {
  kind: WorkoutKind;
  name: string;
  meta: string | null;
  /** The built-in's first picture, as its tile. */
  picture?: LibraryPicture;
  /** Where the row opens; `onOpen` instead toggles the add here, pressed while added. */
  to?: string;
  onOpen?: () => void;
  state: AddState;
  thereLabel: string;
  onAdd: () => void;
  onUndo: () => void;
  /** Members only: muted with the lock, its + the lock too. */
  locked?: boolean;
  /** Beside the name, such as the Yours tag. */
  tag?: React.ReactNode;
};

/** A workout or exercise to add: its row, opening it, with + to add it or Added to take it back. */
export function AddWorkoutRow({
  kind,
  name,
  meta,
  picture,
  to,
  onOpen,
  state,
  thereLabel,
  onAdd,
  onUndo,
  locked = false,
  tag,
}: AddWorkoutRowProps): React.ReactElement {
  const add = t("plan.addNamed", { name });
  return (
    <div className="add-row">
      {to === undefined && onOpen !== undefined ? (
        <button
          type="button"
          className="add-row-main add-row-open"
          aria-pressed={state === "added"}
          onClick={onOpen}
        >
          <CategoryRow kind={kind} name={name} meta={meta} picture={picture} tag={tag} />
        </button>
      ) : (
        <div className="add-row-main">
          <CategoryRow
            kind={kind}
            name={name}
            meta={meta}
            picture={picture}
            to={to}
            locked={locked}
            tag={tag}
          />
        </div>
      )}
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
          className={locked ? "add-row-add add-row-add--locked" : "add-row-add"}
          aria-label={locked ? t("common.membersOnly", { label: add }) : add}
          onClick={onAdd}
        >
          {locked ? <Lock /> : <Icon name="plus" size={18} strokeWidth={2.4} />}
        </button>
      )}
    </div>
  );
}
