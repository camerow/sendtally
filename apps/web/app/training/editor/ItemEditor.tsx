import React from "react";
import { letterOf, type Item, type WeightUnit, type WorkoutKind } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import { enduranceUnitLabel } from "@sendtally/features/log-session";
import {
  doseFieldsFor,
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
  onSwap: () => void;
  /** Only shows the card, as the exercise editor previews it: no move, swap or remove. */
  preview?: boolean;
  /** Absent for the first item. */
  onMoveUp?: () => void;
  /** Absent for the last item. */
  onMoveDown?: () => void;
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
}: ItemEditorProps): React.ReactElement {
  const alternating = item.doses.length > 1;
  const fields = doseFieldsFor(kind, measure, item.doses[0]);
  const laps = measure === "laps";
  const lapUnit = item.doses[0]?.onS === undefined ? "moves" : "seconds";
  const menu = [
    { label: t("workouts.swapExercise"), onSelect: onSwap },
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
    { label: t("workouts.removeExercise", { name }), onSelect: onRemove, destructive: true },
  ];

  return (
    <div className="item-editor" aria-hidden={preview || undefined} inert={preview || undefined}>
      <div className="item-editor-head">
        <span className="item-editor-name">{name}</span>
        {onMoveUp !== undefined && (
          <IconButton icon="up" label={t("workouts.moveUp", { name })} onClick={onMoveUp} />
        )}
        {onMoveDown !== undefined && (
          <IconButton icon="down" label={t("workouts.moveDown", { name })} onClick={onMoveDown} />
        )}
        {preview ? null : alternating ? (
          <MoreMenu label={t("workouts.exerciseMore")} items={menu} />
        ) : (
          <>
            <IconButton icon="restart" label={t("workouts.swapExercise")} onClick={onSwap} />
            <IconButton
              icon="remove"
              label={t("workouts.removeExercise", { name })}
              onClick={onRemove}
            />
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
                  field={field}
                  dose={dose}
                  unit={unit}
                  label={alternating ? `${label} ${letterOf(d)}` : label}
                  placeholder={
                    field.measure === "weight"
                      ? t("hang.bodyweight")
                      : field.placeholder === undefined
                        ? undefined
                        : t(field.placeholder)
                  }
                  onChange={(typed) => onChange(withDose(item, d, typed))}
                />
              );
            })}
            {alternating && (
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
      <div className="item-editor-foot">
        <SwitchField
          label={t("workouts.alternates")}
          checked={alternating}
          onChange={(on) => onChange(withAlternates(item, on))}
        />
      </div>
      <NumberField
        label={laps ? t("workouts.lapRest") : t("hang.fieldSetRest")}
        value={item.doses[0]?.setRestS ?? 0}
        mode={{ kind: "time", max: 3600 }}
        onChange={(seconds) => onChange(withSetRest(item, seconds))}
      />
    </div>
  );
}
