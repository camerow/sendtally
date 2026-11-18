import { CHECKLIST_NAME, exerciseNameKey, type Item, type ItemDone } from "@sendtally/core/hang";

/** A logged entry an app from before checklists may have sent for one: named so, with no flag. */
export const maybeOlderChecklist = (d: ItemDone): boolean =>
  d.checklist === undefined && exerciseNameKey(d.exercise) === exerciseNameKey(CHECKLIST_NAME);

/**
 * The log with each entry an older app sent for a checklist of the workout it ran, at its place,
 * read as that checklist with no line ticked: it logged only that the one set it showed was done,
 * not which lines. So it never becomes an exercise in the library, history or statistics.
 */
export const withWorkoutChecklists = (done: ItemDone[], items: readonly Item[]): ItemDone[] =>
  done.map((d) => {
    const lines = items[d.item]?.checklist?.lines;
    return lines !== undefined && maybeOlderChecklist(d)
      ? { item: d.item, exercise: d.exercise, sets: [], checklist: { lines, checked: [] } }
      : d;
  });
