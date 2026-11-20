import React from "react";
import { Icon } from "../../components/Icon";

export type ExerciseBlockProps = {
  /** Its `ExerciseHead`, or a superset's head and member list. */
  head: React.ReactNode;
  children?: React.ReactNode;
  /** Add set or Add round, under its rows. */
  add?: { label: string; accessibilityLabel?: string; onPress: () => void };
};

/** One exercise, or one superset, on every screen and for every kind: a frame, a head, its rows. */
export function ExerciseBlock({ head, children, add }: ExerciseBlockProps): React.ReactElement {
  return (
    <section className="exercise-block">
      {head}
      {children}
      {add !== undefined && (
        <button
          type="button"
          className="outline-button exercise-block-add"
          aria-label={add.accessibilityLabel}
          onClick={add.onPress}
        >
          <Icon name="plus" size={16} strokeWidth={2.4} />
          {add.label}
        </button>
      )}
    </section>
  );
}
