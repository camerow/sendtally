import { gripMeasureOf, withItemIds, type Dose, type Item } from "@sendtally/core/hang";
import { t } from "../i18n";
import type { EnduranceUnit } from "../log-session";
import type { Picked, WorkoutDraft } from "./types";
import { fingersMeasure, newDoseFor, type DoseMeasure } from "./doseFields";

export const MAX_DOSES = 10;

/** Whether an item's doses suit a grip's measure: both hang, or both pull the same way. */
const fitsGrip = (item: Item, measure?: DoseMeasure): boolean =>
  gripMeasureOf(item.doses[0] ?? { sets: 1 }) === fingersMeasure(measure);

/**
 * New items for what was picked, in order: a grip takes the doses of the grip before it
 * when they are measured the same, anything else the dose its built-in starts at, else its
 * measure's starting dose.
 */
export function withItemsAdded(
  s: WorkoutDraft,
  picked: readonly Picked[],
  newId: () => string
): WorkoutDraft {
  const last = s.items[s.items.length - 1];
  const items = picked.map(({ exercise, measure, dose }): Item => ({
    id: newId(),
    exercise,
    doses:
      s.kind === "hangboard" && last !== undefined && fitsGrip(last, measure)
        ? last.doses.map((d) => ({ ...d }))
        : [dose === undefined ? newDoseFor(s.kind, measure) : { ...dose }],
  }));
  return { ...s, items: [...s.items, ...items] };
}

/** Another exercise in the item's place, keeping its doses unless a grip is measured another way. */
export const withExerciseSwapped = (
  s: WorkoutDraft,
  at: number,
  { exercise, measure }: Picked
): WorkoutDraft => ({
  ...s,
  items: s.items.map((x, i) =>
    i !== at
      ? x
      : s.kind === "hangboard" && !fitsGrip(x, measure)
        ? { ...x, exercise, doses: [newDoseFor(s.kind, measure)] }
        : { ...x, exercise }
  ),
});

export const withItem = (s: WorkoutDraft, at: number, item: Item): WorkoutDraft => ({
  ...s,
  items: s.items.map((x, i) => (i === at ? item : x)),
});

/** Every item with an id before anything moves, so a block's week changes follow their item. */
export const withEditorIds = (s: WorkoutDraft, newId: () => string): WorkoutDraft => ({
  ...s,
  items: withItemIds(s.items, newId),
});

/** The item at `from` swapped with its neighbour at `to`. */
export function withItemMoved(s: WorkoutDraft, from: number, to: number): WorkoutDraft {
  const a = s.items[from];
  const b = s.items[to];
  if (a === undefined || b === undefined) return s;
  return { ...s, items: s.items.map((x, i) => (i === from ? b : i === to ? a : x)) };
}

export const withoutItem = (s: WorkoutDraft, at: number): WorkoutDraft => ({
  ...s,
  items: s.items.filter((_, i) => i !== at),
});

export const withDose = (item: Item, at: number, dose: Dose): Item => ({
  ...item,
  doses: item.doses.map((d, i) => (i === at ? dose : d)),
});

/** A dose's numbers without its name: a copy, or a dose no longer taking turns. */
const unnamed = ({ name: _, ...dose }: Dose): Dose => dose;

/** On: B starts as a copy of A. Off: only A is kept, unnamed. */
export function withAlternates(item: Item, on: boolean): Item {
  const [first = { sets: 1 }] = item.doses;
  if (!on) return { ...item, doses: [unnamed(first)] };
  return item.doses.length > 1 ? item : { ...item, doses: [first, unnamed(first)] };
}

/** One more dose, a copy of the last, taking its turn after the others. */
export function withDoseAdded(item: Item): Item {
  const last = item.doses[item.doses.length - 1];
  if (last === undefined || item.doses.length >= MAX_DOSES) return item;
  return { ...item, doses: [...item.doses, unnamed(last)] };
}

/** A dose's name, as typed; saving trims it. */
export const withDoseName = (item: Item, at: number, name: string): Item => {
  const dose = item.doses[at];
  return dose === undefined ? item : withDose(item, at, { ...unnamed(dose), name });
};

/** A dose's name trimmed, and none when that leaves nothing. */
function savedName(dose: Dose): Dose {
  const name = dose.name?.trim() ?? "";
  return name === "" ? unnamed(dose) : { ...dose, name };
}

/** The last dose dropped, while two are left to take turns. */
export const withoutLastDose = (item: Item): Item =>
  item.doses.length > 2 ? { ...item, doses: item.doses.slice(0, -1) } : item;

/** What a circuit's lap is, the same on every dose: moves, or a time on the wall. */
export const withLapUnit = (item: Item, unit: EnduranceUnit): Item => ({
  ...item,
  doses: item.doses.map(({ reps, onS, ...dose }) =>
    unit === "seconds" ? { ...dose, onS: onS ?? 240 } : { ...dose, reps: reps ?? 40 }
  ),
});

/** The rest between sets, the same on every dose; none at zero. */
export const withSetRest = (item: Item, seconds: number): Item => ({
  ...item,
  doses: item.doses.map(({ setRestS: _, ...dose }) =>
    seconds > 0 ? { ...dose, setRestS: seconds } : dose
  ),
});

/**
 * What saving writes: trimmed text, an untitled workout named, blank dose names dropped,
 * and unnamed exercises left out. Hangboard keeps no minutes: its time is counted from its items.
 */
export function draftOfEditor(s: WorkoutDraft): WorkoutDraft {
  return {
    ...s,
    minutes: s.kind === "hangboard" ? null : s.minutes,
    name: s.name.trim().slice(0, 80) || t("hang.untitledWorkout"),
    description: s.description.trim(),
    items: s.items
      .map((i) => ({ ...i, exercise: i.exercise.trim(), doses: i.doses.map(savedName) }))
      .filter((i) => i.exercise !== ""),
  };
}
