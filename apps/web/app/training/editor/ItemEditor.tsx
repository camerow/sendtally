import React from "react";
import { letterOf, type Item, type WeightUnit, type WorkoutKind } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import { enduranceUnitLabel } from "@sendtally/features/log-session";
import {
  doseFieldsFor,
  fieldPlaceholder,
  MAX_DOSES,
  withAlternates,
  withDose,
  withDoseAdded,
  withDoseName,
  withLapUnit,
  withoutLastDose,
  withSetRest,
  type DoseMeasure,
} from "@sendtally/features/workouts";
import { SwitchField } from "../../components/Switch";
import { Icon, type IconName } from "../../components/Icon";
import { MoreMenu } from "../../components/MoreMenu";
import { NumberField } from "../../components/NumberField";
import { LetterBadge } from "../components/LetterBadge";
import { DoseInput } from "./DoseInput";

export type ItemEditorProps = {
  kind: WorkoutKind;
  item: Item;
  /** Its exercise or grip as the user reads it. */
  name: string;
  /** How its exercise is measured, when it is one of the user's own. */
  measure?: DoseMeasure;
  unit: WeightUnit;
  onChange: (item: Item) => void;
  onRemove: () => void;
  /** Absent where the card offers no swap. */
  onSwap?: () => void;
  /** Shown beside the name, such as a Yours tag. */
  tag?: React.ReactNode;
  /** Only shows the card, as the exercise editor previews it: no move, swap or remove. */
  preview?: boolean;
  /** Absent for the first item. */
  onMoveUp?: () => void;
  /** Absent for the last item. */
  onMoveDown?: () => void;
  /**
   * A superset member, by its letter's place (A is 0): its sets are the superset's rounds, so they are not asked, and its − takes
   * it out of the superset, saying so, rather than out of the workout.
   */
  member?: number;
  /** The wizard's card: one row of numbers per dose, no target RPE or dose name, and Remove in the menu. */
  compact?: boolean;
  /** Takes one dose only, so it offers no alternate sessions. */
  single?: boolean;
};

function IconButton({
  icon,
  label,
  onClick,
}: {
  icon: IconName;
  label: string;
  onClick: () => void;
}): React.ReactElement {
  return (
    <button type="button" className="icon-button" aria-label={label} onClick={onClick}>
      <Icon name={icon} size={18} strokeWidth={2} />
    </button>
  );
}

/**
 * One exercise, or for hangboard one grip, on its own card: the numbers each of its doses
 * asks for by how it is measured, whether sessions take turns between them, and the rest
 * between its sets.
 */
export function ItemEditor({
  kind,
  item,
  name,
  measure,
  unit,
  onChange,
  onRemove,
  onSwap,
  onMoveUp,
  onMoveDown,
  preview = false,
  single = false,
  member,
  tag,
  compact = false,
}: ItemEditorProps): React.ReactElement {
  const alternating = item.doses.length > 1;
  const fields = doseFieldsFor(kind, measure, item.doses[0]).filter(
    (f) => (member === undefined || f.key !== "sets") && !(compact && f.key === "targetRpe")
  );
  const removeLabel =
    member !== undefined
      ? t("workouts.outOfSuperset", { name })
      : t("workouts.removeExercise", { name });
  const laps = measure === "laps";
  const lapUnit = item.doses[0]?.onS === undefined ? "moves" : "seconds";
  const remove = { label: removeLabel, onSelect: onRemove, destructive: member === undefined };
  const menu = [
    ...(onSwap === undefined ? [] : [{ label: t("workouts.swapExercise"), onSelect: onSwap }]),
    ...(item.doses.length < MAX_DOSES
      ? [
          {
            label: t("workouts.addDose", { letter: letterOf(item.doses.length) }),
            onSelect: () => onChange(withDoseAdded(item)),
          },
        ]
      : []),
    ...(item.doses.length > 2
      ? [
          {
            label: t("workouts.removeDose", { letter: letterOf(item.doses.length - 1) }),
            onSelect: () => onChange(withoutLastDose(item)),
          },
        ]
      : []),
    remove,
  ];
  const rest = (
    <NumberField
      label={laps ? t("workouts.lapRest") : t("hang.fieldSetRest")}
      value={item.doses[0]?.setRestS ?? 0}
      mode={{ kind: "time", max: 3600 }}
      onChange={(seconds) => onChange(withSetRest(item, seconds))}
    />
  );

  return (
    <div className="item-editor" aria-hidden={preview || undefined} inert={preview || undefined}>
      <div className="item-editor-head">
        {member !== undefined && <LetterBadge dose={member} plain />}
        <span className="item-editor-name">{name}</span>
        {tag}
        {onMoveUp !== undefined && (
          <IconButton icon="moveUp" label={t("workouts.moveUp", { name })} onClick={onMoveUp} />
        )}
        {onMoveDown !== undefined && (
          <IconButton
            icon="moveDown"
            label={t("workouts.moveDown", { name })}
            onClick={onMoveDown}
          />
        )}
        {preview ? null : alternating || compact ? (
          <MoreMenu label={t("workouts.exerciseMore")} items={compact ? [remove] : menu} />
        ) : (
          <>
            {onSwap !== undefined && (
              <IconButton icon="restart" label={t("workouts.swapExercise")} onClick={onSwap} />
            )}
            <IconButton icon="remove" label={removeLabel} onClick={onRemove} />
          </>
        )}
      </div>
      {laps && (
        <div className="item-editor-row">
          <span>{t("endurance.oneLapIs")}</span>
          <span role="radiogroup" aria-label={t("endurance.oneLapIs")} className="unit-toggle">
            {(["moves", "seconds"] as const).map((u) => (
              <button
                key={u}
                type="button"
                role="radio"
                aria-checked={lapUnit === u}
                onClick={() => onChange(withLapUnit(item, u))}
              >
                {enduranceUnitLabel(u)}
              </button>
            ))}
          </span>
        </div>
      )}
      {item.doses.map((dose, d) => (
        <div key={d} className="dose-row">
          {alternating && <LetterBadge dose={d} />}
          <div className="dose-fields">
            {fields.map((field) => {
              const label = t(field.label);
              return (
                <DoseInput
                  key={field.key}
                  compact={compact}
                  field={field}
                  dose={dose}
                  unit={unit}
                  label={alternating ? `${label} ${letterOf(d)}` : label}
                  placeholder={fieldPlaceholder(field)}
                  onChange={(typed) => onChange(withDose(item, d, typed))}
                />
              );
            })}
            {alternating && !compact && (
              <label className="dose-name">
                <span className="train-label">{t("workouts.doseName")}</span>
                <input
                  className="form-input"
                  value={dose.name ?? ""}
                  maxLength={24}
                  placeholder={t("workouts.doseNameHint")}
                  aria-label={`${t("workouts.doseName")} ${letterOf(d)}`}
                  onChange={(e) => onChange(withDoseName(item, d, e.target.value))}
                />
              </label>
            )}
          </div>
        </div>
      ))}
      {member === undefined && (
        <>
          {compact && <div className="item-editor-rest--compact">{rest}</div>}
          {!single && (
            <div className="item-editor-foot">
              <SwitchField
                label={t("workouts.alternates")}
                checked={alternating}
                onChange={(on) => onChange(withAlternates(item, on))}
              />
            </div>
          )}
          {!compact && rest}
        </>
      )}
    </div>
  );
}
