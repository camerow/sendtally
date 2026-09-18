import React from "react";
import { conflictCandidates } from "./transforms";

export type SaveOutcome<C, R> =
  { kind: "candidates"; candidates: C[] } | { kind: "saved"; result: R };

export type DuplicateCheckSteps<C, R> = {
  similar: () => Promise<C[]>;
  create: (confirmedNew: boolean) => Promise<R>;
};

/**
 * The first save asks for look-alikes and stops if there are any; once they
 * have been shown, the next save is the user saying it is new. The server runs
 * the same check, so its 409 lands in the same place.
 */
export async function saveWithDuplicateCheck<C, R>(
  confirmed: boolean,
  { similar, create }: DuplicateCheckSteps<C, R>
): Promise<SaveOutcome<C, R>> {
  if (!confirmed) {
    const candidates = await similar();
    if (candidates.length > 0) return { kind: "candidates", candidates };
  }
  try {
    return { kind: "saved", result: await create(confirmed) };
  } catch (error: unknown) {
    const candidates = conflictCandidates<C>(error);
    if (candidates === null || candidates.length === 0) throw error;
    return { kind: "candidates", candidates };
  }
}

export type DuplicateCheck<C, R> = {
  candidates: C[];
  /** Candidates are on screen, so the save button reads "Yes, it's new". */
  confirming: boolean;
  save: (steps: DuplicateCheckSteps<C, R>) => Promise<R | null>;
};

/** Candidates belong to one name in one place; changing either starts the check over. */
export function useDuplicateCheck<C, R>(key: string): DuplicateCheck<C, R> {
  const [shown, setShown] = React.useState<{ key: string; candidates: C[] } | null>(null);
  const current = shown !== null && shown.key === key ? shown.candidates : [];
  const confirming = current.length > 0;

  const save = React.useCallback(
    async (steps: DuplicateCheckSteps<C, R>): Promise<R | null> => {
      const outcome = await saveWithDuplicateCheck(confirming, steps);
      if (outcome.kind === "saved") return outcome.result;
      setShown({ key, candidates: outcome.candidates });
      return null;
    },
    [confirming, key]
  );

  return { candidates: current, confirming, save };
}
