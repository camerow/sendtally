import {
  hangSessionItems,
  type HangSession,
  type HangSetup,
  type ItemDone,
} from "@sendtally/core/hang";
import { keptSets } from "../activities/done";
import { hangSets } from "../activities/summary";
import { hangResult, type HangResult } from "./hangResult";

/** Every grip's sets as an edit holds them, and the sets removed by hand. */
export type HangEditSets = { done: ItemDone[]; off: string[] };

type Edited = Pick<HangSession, "gripId" | "protocol" | "pct" | "loadKg" | "done">;

/**
 * A logged session's sets as its edit opens: every grip it ran, the first grip's sets at the
 * session's load following the pill, every other set keeping its own load.
 */
export function hangEditSets(session: Edited): HangEditSets {
  const first: ItemDone = {
    item: 0,
    exercise: session.gripId,
    sets: hangSets(session).map(({ weightKg, ...set }) =>
      weightKg === undefined || weightKg === session.loadKg ? set : { ...set, weightKg }
    ),
  };
  return { done: [first, ...session.done.filter((d) => d.item !== 0)], off: [] };
}

/**
 * What an edit saves. The first grip takes the edited grip and setup; every other grip keeps its
 * own. A grip the edit never held keeps its sets as saved, so no save drops one unseen. A grip's
 * dose saves back only where the session stored one: a shape read from kept sets is not a dose run.
 */
export function hangEditResult(
  session: Edited,
  edited: HangEditSets,
  gripId: string,
  setup: HangSetup
): HangResult {
  const result = hangResult(keptSets(edited.done, edited.off), hangSessionItems(session), (d) =>
    d.item === 0
      ? { exercise: gripId, setup, hang: session.protocol.kind === "hang" }
      : {
          exercise: session.done.find((s) => s.item === d.item)?.exercise ?? d.exercise,
          setup: { edgeMm: d.sets[0]?.edgeMm ?? 0, loadKg: session.loadKg },
          hang: d.sets[0]?.edgeMm !== undefined,
        }
  );
  const shown = new Set(edited.done.map((d) => d.item));
  const unseen = session.done.filter((d) => !shown.has(d.item));
  const stored = new Set(session.done.filter((d) => d.dose !== undefined).map((d) => d.item));
  const done = result.done.map(({ dose, ...d }) => (stored.has(d.item) ? { ...d, dose } : d));
  return { ...result, done: [...done, ...unseen].sort((a, b) => a.item - b.item) };
}
