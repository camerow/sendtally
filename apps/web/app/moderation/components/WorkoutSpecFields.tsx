import React from "react";
import type { BuiltInLibrary } from "@sendtally/api-client";
import { gripMeasureOf, WORKOUT_KINDS, type Dose, type WeightUnit } from "@sendtally/core/hang";
import { categoryLabel } from "@sendtally/features/library";
import { doseMeasureOf, newDoseFor, type DoseMeasure } from "@sendtally/features/workouts";
import { chipStyle } from "../../components/chip";
import { ComboField, type ComboItem } from "../../components/ComboField";
import { NumberField } from "../../components/NumberField";
import { inputStyle } from "../../components/styles";
import { FocusField } from "../../training/log/FocusField";
import { ItemEditor } from "../../training/editor/ItemEditor";
import { TargetEffort } from "../../training/editor/TargetEffort";
import {
  withWorkoutKind,
  type ItemDraft,
  type ItemRef,
  type WorkoutSpecDraft,
} from "../libraryDraft";

export type WorkoutSpecFieldsProps = {
  draft: WorkoutSpecDraft;
  library: BuiltInLibrary;
  unit: WeightUnit;
  onChange: (draft: WorkoutSpecDraft) => void;
};

const STEPS = { hard: "Hard interval", easy: "Easy interval" } as const;

const MAX_MINUTES = 600;

type Pick = { ref: ItemRef; name: string; section: string; measure?: DoseMeasure; dose?: Dose };

/** What a workout of this kind can hold: grips for hangboard, else built-in exercises and interval steps. */
function picksFor(library: BuiltInLibrary, fingers: boolean): Pick[] {
  if (fingers)
    return library.grips
      .filter((g) => g.status === "active")
      .map((g) => ({ ref: { grip: g.id } as ItemRef, name: g.name, section: "Grips" }));
  return [
    ...library.exercises
      .filter((e) => e.status === "active")
      .map((e) => ({
        ref: { exercise: e.id },
        name: e.name,
        section: `${categoryLabel(e.spec.kind)} exercises`,
        measure: doseMeasureOf(e.spec),
        dose: e.spec.dose,
      })),
    ...(["hard", "easy"] as const).map((step) => ({
      ref: { step },
      name: STEPS[step],
      section: "Interval steps",
    })),
  ];
}

const sameRef = (a: ItemRef, b: ItemRef): boolean => JSON.stringify(a) === JSON.stringify(b);

/**
 * A new built-in workout's kind, focus, items and their doses, and, outside hangboard, its
 * minutes and target RPE.
 */
export function WorkoutSpecFields({
  draft,
  library,
  unit,
  onChange,
}: WorkoutSpecFieldsProps): React.ReactElement {
  const [query, setQuery] = React.useState("");
  const fingers = draft.kind === "hangboard";
  const picks = picksFor(library, fingers);
  const pickOf = (ref: ItemRef): Pick | undefined => picks.find((p) => sameRef(p.ref, ref));
  const measureOf = (item: ItemDraft): DoseMeasure | undefined =>
    fingers ? gripMeasureOf(item.doses[0] ?? { sets: 1 }) : pickOf(item.ref)?.measure;
  const setItems = (items: ItemDraft[]): void => onChange({ ...draft, items });
  const move = (i: number, by: number): void => {
    const items = [...draft.items];
    const [item] = items.splice(i, 1);
    items.splice(i + by, 0, item!);
    setItems(items);
  };
  const matches = picks.filter((p) => p.name.toLowerCase().includes(query.trim().toLowerCase()));
  const options: ComboItem[] = matches.map((p) => ({
    key: JSON.stringify(p.ref),
    label: p.name,
    section: p.section,
    onPick: () => {
      setQuery("");
      setItems([
        ...draft.items,
        {
          key: crypto.randomUUID(),
          ref: p.ref,
          doses: [p.dose ?? newDoseFor(draft.kind, p.measure)],
        },
      ]);
    },
  }));

  return (
    <>
      <div className="form-section">
        <span className="train-label">Kind</span>
        <div className="setup-chips" role="radiogroup" aria-label="Kind">
          {WORKOUT_KINDS.map((k) => (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={draft.kind === k}
              style={chipStyle(draft.kind === k, { minHeight: 40 })}
              onClick={() => onChange(withWorkoutKind(draft, k))}
            >
              {categoryLabel(k)}
            </button>
          ))}
        </div>
        {draft.items.length > 0 && (
          <span className="form-hint">
            Moving in or out of Fingers empties the items, since grips and exercises do not mix.
          </span>
        )}
      </div>
      <FocusField value={draft.focus} onChange={(focus) => onChange({ ...draft, focus })} />
      <div className="form-section">
        <span className="train-label">Items</span>
        {fingers && (
          <span className="form-hint">
            Edge depth and added weight are chosen each time, so they are not saved.
          </span>
        )}
        {draft.items.map((item, i) => (
          <ItemEditor
            key={item.key}
            kind={draft.kind}
            item={{ exercise: pickOf(item.ref)?.name ?? "", doses: item.doses }}
            name={pickOf(item.ref)?.name ?? ""}
            measure={measureOf(item)}
            unit={unit}
            onChange={(next) =>
              setItems(draft.items.map((it, at) => (at === i ? { ...it, doses: next.doses } : it)))
            }
            onRemove={() => setItems(draft.items.filter((_, at) => at !== i))}
            {...(i > 0 && { onMoveUp: () => move(i, -1) })}
            {...(i < draft.items.length - 1 && { onMoveDown: () => move(i, 1) })}
          />
        ))}
        <ComboField
          value={query}
          items={options}
          ariaLabel={fingers ? "Add a grip" : "Add an exercise"}
          placeholder={fingers ? "Add a grip" : "Add an exercise or interval step"}
          inputStyle={inputStyle}
          onChange={setQuery}
        />
      </div>
      {!fingers && (
        <>
          <NumberField
            label="Duration"
            value={draft.minutes === null ? null : draft.minutes * 60}
            mode={{ kind: "time", max: MAX_MINUTES * 60 }}
            onChange={(seconds) =>
              onChange({
                ...draft,
                minutes:
                  seconds === 0
                    ? null
                    : Math.min(MAX_MINUTES, Math.max(1, Math.round(seconds / 60))),
              })
            }
          />
          <TargetEffort
            value={draft.targetRpe}
            onChange={(targetRpe) => onChange({ ...draft, targetRpe })}
          />
        </>
      )}
    </>
  );
}
