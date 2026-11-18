import {
  CHECKLIST_NAME,
  MAX_CHECKLIST_LINE,
  MAX_CHECKLIST_LINES,
  defaultExerciseRestS,
  gripMeasureOf,
  gripsTogether,
  withItemIds,
  workoutKindOfItems,
  type Dose,
  type Item,
  type WorkoutKind,
} from "@sendtally/core/hang";
import { t } from "../i18n";
import type { EnduranceUnit } from "../log-session";
import type { Picked, WorkoutDraft } from "./types";
import { fingersMeasure, newDoseFor, type DoseMeasure } from "./doseFields";

export const MAX_DOSES = 10;

/** Whether an item's doses suit a grip's measure: both hang, or both pull the same way. */
const fitsGrip = (item: Item, measure?: DoseMeasure): boolean =>
  gripMeasureOf(item.doses[0] ?? { sets: 1 }) === fingersMeasure(measure);

/** Which items name grips; by default every item of a Fingers workout and none of any other. */
type IsGrip = (exercise: string) => boolean;
const byKind =
  (s: WorkoutDraft): IsGrip =>
  () =>
    s.kind === "hangboard";

/**
 * New items for what was picked, in order: a grip takes the doses of the last grip when they
 * are measured the same, anything else the dose its built-in starts at, else its measure's
 * starting dose. Grips stay one block, so a new grip lands after the last grip.
 */
export function withItemsAdded(
  s: WorkoutDraft,
  picked: readonly Picked[],
  newId: () => string,
  isGrip: IsGrip = byKind(s)
): WorkoutDraft {
  const last = s.items.filter((i) => isGrip(i.exercise)).at(-1);
  const items = picked.map(({ exercise, kind, measure, dose }): Item => ({
    id: newId(),
    exercise,
    doses:
      kind === "hangboard" && last !== undefined && fitsGrip(last, measure)
        ? last.doses.map((d) => ({ ...d }))
        : [dose === undefined ? newDoseFor(kind, measure) : { ...dose }],
  }));
  const grips = new Set(picked.filter((p) => p.kind === "hangboard").map((p) => p.exercise));
  return {
    ...s,
    items: gripsTogether([...s.items, ...items], (e) => grips.has(e) || isGrip(e)),
  };
}

/**
 * The draft with its kind read off its exercises (see `workoutKindOf`), an exercise the
 * library does not know yet counting as the kind it had. A rest between exercises left at the
 * old kind's default moves to the new one's.
 */
export function withDerivedKind(
  s: WorkoutDraft,
  kindIn: (exercise: string) => WorkoutKind | undefined
): WorkoutDraft {
  const kind = workoutKindOfItems(s.items, kindIn, s.kind);
  if (kind === s.kind) return s;
  const rest = s.exerciseRestS === defaultExerciseRestS(s.kind);
  return { ...s, kind, exerciseRestS: rest ? defaultExerciseRestS(kind) : s.exerciseRestS };
}

/**
 * Another exercise in the item's place, keeping its doses unless a grip is measured another
 * way, or a grip and an exercise trade places.
 */
export const withExerciseSwapped = (
  s: WorkoutDraft,
  at: number,
  { exercise, kind, measure }: Picked,
  isGrip: IsGrip = byKind(s)
): WorkoutDraft => ({
  ...s,
  items: s.items.map((x, i) =>
    i !== at
      ? x
      : (kind === "hangboard" ? !isGrip(x.exercise) || !fitsGrip(x, measure) : isGrip(x.exercise))
        ? { ...x, exercise, doses: [newDoseFor(kind, measure)] }
        : { ...x, exercise }
  ),
});

/** A checklist at the end, its first line ready to type. */
export const withChecklistAdded = (s: WorkoutDraft, newId: () => string): WorkoutDraft => ({
  ...s,
  items: [
    ...s.items,
    { id: newId(), exercise: CHECKLIST_NAME, doses: [{ sets: 1 }], checklist: { lines: [""] } },
  ],
});

/** A checklist's lines as typed; saving trims them and drops blank ones. */
export const withChecklistLines = (item: Item, lines: readonly string[]): Item => ({
  ...item,
  checklist: { lines: [...lines] },
});

const linesOf = (item: Item): string[] => item.checklist?.lines ?? [""];

/** A line as typed, cut at the longest a line can be. */
export const withLineTyped = (item: Item, at: number, text: string): Item =>
  withChecklistLines(
    item,
    linesOf(item).map((l, n) => (n === at ? text.slice(0, MAX_CHECKLIST_LINE) : l))
  );

/** A blank line under the one at `at`, while the checklist has room for one. */
export const withLineAfter = (item: Item, at: number): Item => {
  const lines = linesOf(item);
  return lines.length >= MAX_CHECKLIST_LINES
    ? item
    : withChecklistLines(item, [...lines.slice(0, at + 1), "", ...lines.slice(at + 1)]);
};

/** A checklist's typed lines trimmed, blank ones gone; null when none is left. */
const savedChecklist = (item: Item): Item | null => {
  if (item.checklist === undefined) return item;
  const lines = item.checklist.lines.map((l) => l.trim()).filter((l) => l !== "");
  return lines.length === 0 ? null : { ...item, checklist: { lines } };
};

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

/** The rest after the item at `at`, before the next; it moves with that item. */
export const withRestAfter = (s: WorkoutDraft, at: number, seconds: number): WorkoutDraft => ({
  ...s,
  items: s.items.map((x, i) => (i === at ? { ...x, restAfterS: seconds } : x)),
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
      .flatMap((i) => {
        const kept = savedChecklist(i);
        return kept === null || kept.exercise === "" ? [] : [kept];
      }),
  };
}
