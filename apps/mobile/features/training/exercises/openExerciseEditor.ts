import { router } from "expo-router";
import type { WorkoutKind } from "@sendtally/core/hang";
import type { ExerciseForm } from "./types";

type OnSave = (form: ExerciseForm) => void;

const waiting = new Map<string, OnSave>();
let opened = 0;

/**
 * The exercise editor for a new exercise of a kind, its name started from what was typed.
 * With onSave, saving hands the form back to the screen that opened it, which makes it
 * there (a workout adds it); without, the editor makes it and opens it.
 */
export function openExerciseEditor(kind: WorkoutKind, name = "", onSave?: OnSave): void {
  const ret = onSave === undefined ? undefined : String((opened += 1));
  if (ret !== undefined && onSave !== undefined) waiting.set(ret, onSave);
  router.push({
    pathname: "/exercise/edit",
    params: { kind, ...(name !== "" && { name }), ...(ret !== undefined && { ret }) },
  });
}

/** Who asked for the exercise an editor makes, if it is still waiting. */
export const openerOf = (ret: string | undefined): OnSave | undefined =>
  ret === undefined ? undefined : waiting.get(ret);

/** Done with an editor's opener, saved or not. */
export function forgetOpener(ret: string | undefined): void {
  if (ret !== undefined) waiting.delete(ret);
}
