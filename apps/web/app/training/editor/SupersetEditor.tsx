import React from "react";
import type { ItemGroup } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import { Icon } from "../../components/Icon";
import { NumberField } from "../../components/NumberField";

export type SupersetEditorProps = {
  group: ItemGroup;
  onChange: (change: Partial<Omit<ItemGroup, "id">>) => void;
  onUngroup: () => void;
  /** Absent once it holds as many members as a superset can. */
  onAdd?: () => void;
  /** Absent for the first item. */
  onMoveUp?: () => void;
  /** Absent for the last item. */
  onMoveDown?: () => void;
  /** Its members' cards. */
  children: React.ReactNode;
};

const MAX_ROUNDS = 100;

/** A superset in the editor: its rounds, its two rests, its members, + Add to superset and Ungroup. */
export function SupersetEditor({
  group,
  onChange,
  onUngroup,
  onAdd,
  onMoveUp,
  onMoveDown,
  children,
}: SupersetEditorProps): React.ReactElement {
  const rounds = (n: number): number => Math.min(MAX_ROUNDS, Math.max(1, n));
  return (
    <div className="superset-editor">
      <div className="item-editor-head">
        <span className="item-editor-name">{t("workouts.superset")}</span>
        {onMoveUp !== undefined && (
          <button
            type="button"
            className="icon-button"
            aria-label={t("workouts.moveUp", { name: t("workouts.superset") })}
            onClick={onMoveUp}
          >
            <Icon name="moveUp" size={18} strokeWidth={2} />
          </button>
        )}
        {onMoveDown !== undefined && (
          <button
            type="button"
            className="icon-button"
            aria-label={t("workouts.moveDown", { name: t("workouts.superset") })}
            onClick={onMoveDown}
          >
            <Icon name="moveDown" size={18} strokeWidth={2} />
          </button>
        )}
      </div>
      <div className="superset-rounds">
        <span className="train-label" aria-hidden="true">
          {t("workouts.rounds")}
        </span>
        <button
          type="button"
          className="superset-step"
          aria-label={t("workouts.fewerRounds")}
          onClick={() => onChange({ rounds: rounds(group.rounds - 1) })}
        >
          −
        </button>
        <NumberField
          compact
          label={t("workouts.rounds")}
          value={group.rounds}
          mode={{ kind: "number", step: 1, min: 1, max: MAX_ROUNDS }}
          onChange={(n) => onChange({ rounds: rounds(n) })}
        />
        <button
          type="button"
          className="superset-step"
          aria-label={t("workouts.moreRounds")}
          onClick={() => onChange({ rounds: rounds(group.rounds + 1) })}
        >
          +
        </button>
      </div>
      <div className="superset-rests">
        <NumberField
          label={t("workouts.restBetweenExercises")}
          value={group.restBetweenS}
          mode={{ kind: "time", max: 3600 }}
          onChange={(restBetweenS) => onChange({ restBetweenS })}
        />
        <NumberField
          label={t("workouts.restBetweenRounds")}
          value={group.restRoundS}
          mode={{ kind: "time", max: 3600 }}
          onChange={(restRoundS) => onChange({ restRoundS })}
        />
      </div>
      {children}
      <div className="superset-foot">
        {onAdd !== undefined && (
          <button type="button" className="outline-button" onClick={onAdd}>
            + {t("workouts.addToSuperset")}
          </button>
        )}
        <button type="button" className="text-button" onClick={onUngroup}>
          {t("workouts.ungroup")}
        </button>
      </div>
    </div>
  );
}
