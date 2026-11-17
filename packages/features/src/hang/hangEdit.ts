import {
  hangSessionItems,
  type HangSession,
  type HangSetup,
  type ItemDone,
  type SetDone,
} from "@sendtally/core/hang";
import { hangSets } from "../activities/summary";
import { hangResult, keptHangs, type HangItemSetup, type HangResult } from "./hangResult";

/** Every grip's sets as an edit holds them, and the sets removed by hand. */
export type HangEditSets = { done: ItemDone[]; off: string[] };

type Edited = Pick<HangSession, "gripId" | "protocol" | "pct" | "loadKg" | "done">;

/**
 * A logged session's sets as its edit opens: every grip it ran, the first grip's sets at the
 * session's load following the pill, every other set keeping its own load; a grip that held
 * nothing opens on its planned sets, none held.
 */
export function hangEditSets(session: Edited): HangEditSets {
  const items = hangSessionItems(session);
  const unheld = (item: number): SetDone[] => {
    const dose = items[item]?.dose;
    const set: SetDone = {
      reps: 0,
      ...(dose?.edgeMm !== undefined && { edgeMm: dose.edgeMm }),
      ...(dose?.weightKg !== undefined && { weightKg: dose.weightKg }),
    };
    return Array.from({ length: dose?.sets ?? 0 }, () => set);
  };
  const sets = hangSets(session).map(({ weightKg, ...set }) =>
    weightKg === undefined || weightKg === session.loadKg ? set : { ...set, weightKg }
  );
  const first: ItemDone = {
    item: 0,
    exercise: session.gripId,
    sets: sets.length > 0 ? sets : unheld(0),
  };
  const rest = session.done
    .filter((d) => d.item !== 0)
    .map((d) => (d.sets.length > 0 ? d : { ...d, sets: unheld(d.item) }));
  return { done: [first, ...rest], off: [] };
}

/** A later grip's name, edge and load: from its kept sets, or the rows it showed when none held. */
const itemSetup = (session: Edited, d: ItemDone, shown: SetDone | undefined): HangItemSetup => {
  const first = d.sets[0] ?? shown;
  return {
    exercise: session.done.find((s) => s.item === d.item)?.exercise ?? d.exercise,
    setup: {
      edgeMm: first?.edgeMm ?? 0,
      loadKg: d.sets.length > 0 ? session.loadKg : (first?.weightKg ?? session.loadKg),
    },
    hang: first?.edgeMm !== undefined,
  };
};

/**
 * What an edit saves. The first grip takes the edited grip and setup; every other grip keeps its
 * own. A grip the edit never held keeps its sets as saved, so no save drops one unseen. A grip's
 * dose saves back where the session stored one, or where it holds no sets to read it from.
 */
export function hangEditResult(
  session: Edited,
  edited: HangEditSets,
  gripId: string,
  setup: HangSetup
): HangResult {
  const result = hangResult(keptHangs(edited.done, edited.off), hangSessionItems(session), (d) =>
    d.item === 0
      ? { exercise: gripId, setup, hang: session.protocol.kind === "hang" }
      : itemSetup(session, d, edited.done.find((x) => x.item === d.item)?.sets[0])
  );
  const shown = new Set(edited.done.map((d) => d.item));
  const unseen = session.done.filter((d) => !shown.has(d.item));
  const stored = new Set(session.done.filter((d) => d.dose !== undefined).map((d) => d.item));
  const done = result.done
    .filter((d) => shown.has(d.item))
    .map(({ dose, ...d }) => (stored.has(d.item) || d.sets.length === 0 ? { ...d, dose } : d));
  return { ...result, done: [...done, ...unseen].sort((a, b) => a.item - b.item) };
}
