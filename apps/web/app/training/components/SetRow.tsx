import React from "react";
import { Icon } from "../../components/Icon";
import { SET_COLUMNS } from "./setColumns";

export type SetRowProps = {
  /** Its place, quietest in the row: "1", "B2", "Lap 3"; "" for a checklist line, which has none. */
  position: string;
  /** A superset member's or a climb's name, on its own line over the row. */
  name?: string;
  /** The row's fields or a kind's content, filling the grid after the position. */
  children: React.ReactNode;
  /** The RPE column, for a block that asks a set RPE: null keeps the column empty. Read mode widens it for a mark. */
  rpe?: React.ReactElement | null;
  /** Edit: the tick, or `trailing` in its place. Read: values as text, nothing trailing. */
  mode?: "edit" | "read";
  ticked?: boolean;
  onToggle?: () => void;
  /** In place of the tick, such as Start lap; null for a row with nothing trailing, such as a hang set. */
  trailing?: React.ReactNode;
  /** Names the set for screen readers: its tick and its select. */
  label: string;
  selected?: boolean;
  /** A click on the row outside its inputs and tick selects it, and another unselects it. */
  onSelect?: () => void;
  /** Takes the row out: shown in place of the position while selected. */
  onRemove?: () => void;
  removeLabel?: string;
};

/** What a click lands on that is a control of its own, which never selects the row. */
export const onControl = (target: EventTarget): boolean =>
  target instanceof Element &&
  target.closest("input, button, label, a, select, textarea, .number-field") !== null;

/** One row of the set grid, in the run, the review and the finished workout. */
export function SetRow({
  position,
  name,
  children,
  rpe,
  mode = "edit",
  ticked = false,
  onToggle,
  trailing,
  label,
  selected = false,
  onSelect,
  onRemove,
  removeLabel,
}: SetRowProps): React.ReactElement {
  const read = mode === "read";
  const removing = selected && onRemove !== undefined;
  const place = removing ? (
    <button
      type="button"
      className={`${SET_COLUMNS.position} set-remove-button`}
      aria-label={removeLabel ?? label}
      onClick={onRemove}
    >
      <Icon name="minusCircle" size={24} strokeWidth={1.5} />
    </button>
  ) : name === undefined && onSelect !== undefined ? (
    <button
      type="button"
      className={`${SET_COLUMNS.position} set-select`}
      aria-label={label}
      aria-pressed={selected}
      onClick={onSelect}
    >
      {position}
    </button>
  ) : (
    <span className={SET_COLUMNS.position}>{position}</span>
  );
  return (
    <div
      className={["set-item", read && "set-item--read", selected && "set-item--selected"]
        .filter(Boolean)
        .join(" ")}
      onClick={(e) => {
        if (onSelect === undefined || onControl(e.target)) return;
        e.stopPropagation();
        onSelect();
      }}
    >
      {name !== undefined && (
        <div className={`${SET_COLUMNS.row} set-item-name-line`}>
          {position !== "" && place}
          {onSelect === undefined ? (
            <span className="set-item-name">{name}</span>
          ) : (
            <button
              type="button"
              className="set-item-name set-select"
              aria-pressed={selected}
              onClick={onSelect}
            >
              {name}
            </button>
          )}
        </div>
      )}
      <div className={`${SET_COLUMNS.row} set-item-line`}>
        {position !== "" &&
          (name === undefined ? place : <span className={SET_COLUMNS.position} />)}
        <span className={SET_COLUMNS.lead}>{children}</span>
        {rpe !== undefined && (
          <span className={read ? SET_COLUMNS.rpeRead : SET_COLUMNS.rpe}>{rpe}</span>
        )}
        {!read &&
          (trailing !== undefined ? (
            trailing
          ) : (
            <label className={SET_COLUMNS.tick}>
              <input
                type="checkbox"
                className="set-check"
                checked={ticked}
                onChange={onToggle}
                aria-label={label}
              />
            </label>
          ))}
      </div>
    </div>
  );
}
