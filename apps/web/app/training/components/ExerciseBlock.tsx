import React from "react";
import { Icon } from "../../components/Icon";
import { onControl } from "./SetRow";

export type ExerciseBlockProps = {
  /** Its `ExerciseHead`, or a superset's head and member list. */
  head: React.ReactNode;
  children?: React.ReactNode;
  /** Add set or Add round, under its rows. */
  add?: { label: string; accessibilityLabel?: string; onPress: () => void };
  /** The card's timer, beside Add set and filling the rest of its line. */
  action?: { label: string; onPress: () => void };
  /** A click on the block outside its controls, such as a climbing card taking the grade picker. */
  onPress?: () => void;
};

/** One exercise, or one superset, on every screen and for every kind: a frame, a head, its rows. */
export function ExerciseBlock({
  head,
  children,
  add,
  action,
  onPress,
}: ExerciseBlockProps): React.ReactElement {
  return (
    <section
      className="exercise-block"
      onClick={
        onPress === undefined
          ? undefined
          : (e) => {
              if (!onControl(e.target)) onPress();
            }
      }
    >
      {head}
      {children}
      {add !== undefined && (
        <div className={action === undefined ? undefined : "exercise-block-foot"}>
          <button
            type="button"
            className="outline-button exercise-block-add"
            aria-label={add.accessibilityLabel}
            onClick={add.onPress}
          >
            <Icon name="plus" size={16} strokeWidth={2.4} />
            {add.label}
          </button>
          {action !== undefined && (
            <button
              type="button"
              className="detail-primary exercise-block-action"
              onClick={action.onPress}
            >
              <Icon name="play" size={16} strokeWidth={2.2} />
              {action.label}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
