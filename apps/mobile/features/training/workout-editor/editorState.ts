import { BUILT_IN_GRIPS, defaultPattern, type Item, type WorkoutKind } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import type { WorkoutDraft } from "@sendtally/features/workouts";
import { NEW_DOSE } from "./doseFields";

/** Where one item sits: its variation, then its place in it. */
export type ItemAt = { variation: number; item: number };

export const MAX_VARIATIONS = 10;
const MAX_STEPS = 20;

/** A, B, C: how the editor and the pattern name a variation. */
export const letterOf = (variation: number): string => String.fromCharCode(65 + variation);

/** A new item: a copy of the one before it, or the kind's starting dose on the first grip. */
export function newItem(kind: WorkoutKind, previous?: Item): Item {
  if (previous !== undefined) return { exercise: previous.exercise, dose: { ...previous.dose } };
  return { exercise: kind === "hangboard" ? BUILT_IN_GRIPS[0] : "", dose: { ...NEW_DOSE[kind] } };
}

/** A new workout of the kind starts with one item, except climbing, which often has none. */
export function startingDraft(draft: WorkoutDraft): WorkoutDraft {
  const empty = draft.variations.every((v) => v.items.length === 0);
  return empty && draft.kind !== "climbing" ? withItemAdded(draft, 0) : draft;
}

const mapVariation = (
  s: WorkoutDraft,
  at: number,
  change: (items: Item[]) => Item[]
): WorkoutDraft => ({
  ...s,
  variations: s.variations.map((v, i) => (i === at ? { ...v, items: change(v.items) } : v)),
});

export const withItemAdded = (s: WorkoutDraft, variation: number): WorkoutDraft =>
  mapVariation(s, variation, (items) => [...items, newItem(s.kind, items[items.length - 1])]);

export const withItem = (s: WorkoutDraft, at: ItemAt, item: Item): WorkoutDraft =>
  mapVariation(s, at.variation, (items) => items.map((x, i) => (i === at.item ? item : x)));

export const withoutItem = (s: WorkoutDraft, at: ItemAt): WorkoutDraft =>
  mapVariation(s, at.variation, (items) => items.filter((_, i) => i !== at.item));

export const withLabel = (s: WorkoutDraft, variation: number, label: string): WorkoutDraft => ({
  ...s,
  variations: s.variations.map((v, i) => (i === variation ? { ...v, label } : v)),
});

/** On: B starts as a copy of A, taking turns. Off: only A is kept. */
export function withAlternates(s: WorkoutDraft, on: boolean): WorkoutDraft {
  const [first = { label: "", items: [] }] = s.variations;
  if (!on) return { ...s, variations: [first], pattern: [0] };
  if (s.variations.length > 1) return s;
  return {
    ...s,
    variations: [first, { label: "", items: first.items.map((i) => newItem(s.kind, i)) }],
    pattern: [0, 1],
  };
}

/** One more variation, a copy of the last, taking its turn after the others. */
export function withVariationAdded(s: WorkoutDraft): WorkoutDraft {
  const last = s.variations[s.variations.length - 1];
  if (last === undefined || s.variations.length >= MAX_VARIATIONS) return s;
  const copy = { label: "", items: last.items.map((i) => newItem(s.kind, i)) };
  return {
    ...s,
    variations: [...s.variations, copy],
    pattern: [...s.pattern, s.variations.length].slice(0, MAX_STEPS),
  };
}

/** Drops a variation and its steps; letters after it move up one. */
export function withoutVariation(s: WorkoutDraft, variation: number): WorkoutDraft {
  const variations = s.variations.filter((_, i) => i !== variation);
  const pattern = s.pattern.filter((i) => i !== variation).map((i) => (i > variation ? i - 1 : i));
  return {
    ...s,
    variations,
    pattern:
      variations.length < 2 || pattern.length === 0 ? defaultPattern(variations.length) : pattern,
  };
}

/** A tap on a step: the next letter, round to A after the last. */
export const withStepCycled = (s: WorkoutDraft, step: number): WorkoutDraft => ({
  ...s,
  pattern: s.pattern.map((v, i) => (i === step ? (v + 1) % s.variations.length : v)),
});

/** A step after the last, taking the letter after its letter. */
export function withStepAdded(s: WorkoutDraft): WorkoutDraft {
  if (s.pattern.length >= MAX_STEPS) return s;
  const last = s.pattern[s.pattern.length - 1] ?? -1;
  return { ...s, pattern: [...s.pattern, (last + 1) % s.variations.length] };
}

export const withoutStep = (s: WorkoutDraft, step: number): WorkoutDraft =>
  s.pattern.length < 2 ? s : { ...s, pattern: s.pattern.filter((_, i) => i !== step) };

/** What saving writes: trimmed text, an untitled workout named, and unnamed exercises left out. */
export function draftOfEditor(s: WorkoutDraft): WorkoutDraft {
  return {
    ...s,
    name: s.name.trim().slice(0, 80) || t("hang.untitledWorkout"),
    description: s.description.trim(),
    variations: s.variations.map((v) => ({
      label: v.label.trim(),
      items: v.items
        .map((i) => ({ ...i, exercise: i.exercise.trim() }))
        .filter((i) => i.exercise !== ""),
    })),
  };
}
