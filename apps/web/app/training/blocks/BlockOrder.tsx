import React from "react";
import type { Membership } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import type { WorkoutLookup } from "@sendtally/features/training";
import { Icon } from "../../components/Icon";
import { CategoryMark } from "../components/CategoryMark";

export type BlockOrderProps = {
  members: readonly Membership[];
  workout: WorkoutLookup;
  onMove: (membershipId: string, by: -1 | 1) => void;
};

/** The block's workouts in order, each moved up or down a place. */
export function BlockOrder({ members, workout, onMove }: BlockOrderProps): React.ReactElement {
  return (
    <section className="block-order">
      <h2 className="plan-label">{t("plan.order")}</h2>
      {members.map((m, i) => {
        const w = workout(m.workoutId);
        const name = w?.name ?? "";
        return (
          <div key={m.id} className="block-order-row">
            <span className="block-order-n">{i + 1}</span>
            {w !== undefined && <CategoryMark kind={w.kind} />}
            <span className="block-order-name">{name}</span>
            <button
              type="button"
              className="icon-button"
              aria-label={t("workouts.moveUp", { name })}
              disabled={i === 0}
              onClick={() => onMove(m.id, -1)}
            >
              <Icon name="up" size={18} strokeWidth={2} />
            </button>
            <button
              type="button"
              className="icon-button"
              aria-label={t("workouts.moveDown", { name })}
              disabled={i === members.length - 1}
              onClick={() => onMove(m.id, 1)}
            >
              <Icon name="down" size={18} strokeWidth={2} />
            </button>
          </div>
        );
      })}
    </section>
  );
}
