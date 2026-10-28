import { BUILT_IN_GRIPS, type Dose, type Item } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import type { WorkoutDraft } from "@sendtally/features/workouts";
import type { Picked } from "../exercise-picker/types";
import { newDoseFor } from "./doseFields";

export const MAX_DOSES = 10;

/**
 * New items for what was picked, in order: a grip takes the doses of the grip before it,
 * anything else its measure's starting dose.
 */
export function withItemsAdded(s: WorkoutDraft, picked: readonly Picked[]): WorkoutDraft {
  const last = s.items[s.items.length - 1];
  const items = picked.map(({ exercise, measure }): Item =>
    s.kind === "hangboard" && last !== undefined
      ? { exercise, doses: last.doses.map((d) => ({ ...d })) }
      : { exercise, doses: [newDoseFor(s.kind, measure)] }
  );
  return { ...s, items: [...s.items, ...items] };
}

/** A new hangboard workout starts on the first grip; anything else starts empty, to pick into. */
export function startingDraft(draft: WorkoutDraft): WorkoutDraft {
  return draft.items.length === 0 && draft.kind === "hangboard"
    ? withItemsAdded(draft, [{ exercise: BUILT_IN_GRIPS[0] }])
    : draft;
}

/** Another exercise in the item's place, keeping its doses. */
export const withExerciseSwapped = (
  s: WorkoutDraft,
  at: number,
  exercise: string
): WorkoutDraft => ({
  ...s,
  items: s.items.map((x, i) => (i === at ? { ...x, exercise } : x)),
});

export const withItem = (s: WorkoutDraft, at: number, item: Item): WorkoutDraft => ({
  ...s,
  items: s.items.map((x, i) => (i === at ? item : x)),
});

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
