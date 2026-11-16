import React from "react";
import type { WorkoutKind } from "@sendtally/core/hang";
import { withDerivedKind } from "./editorState";
import type { Picked, WorkoutDraft } from "./types";

/**
 * A workout draft whose kind follows its exercises on every change. `known` reads an exercise's
 * kind from the library; `remember` covers ones just picked, which a new exercise may not be in yet.
 */
export function useDerivedKindDraft(
  initial: WorkoutDraft,
  known: (exercise: string) => WorkoutKind | undefined
): {
  state: WorkoutDraft;
  setState: (next: (s: WorkoutDraft) => WorkoutDraft) => void;
  remember: (picked: readonly Picked[]) => void;
} {
  const [state, setDraft] = React.useState(initial);
  const picked = React.useRef(new Map<string, WorkoutKind>());
  const kindIn = (exercise: string): WorkoutKind | undefined =>
    picked.current.get(exercise) ?? known(exercise);
  return {
    state,
    setState: (next) => setDraft((s) => withDerivedKind(next(s), kindIn)),
    remember: (list) => list.forEach((p) => picked.current.set(p.exercise, p.kind)),
  };
}
