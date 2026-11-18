import { doseProtocol, protocolDose, type Dose, type SessionItem, type SetDone } from "./plan";
import { totalSeconds } from "./protocol";
import type { HangSession } from "./types";

type Logged = Pick<HangSession, "gripId" | "protocol" | "done">;

/** A hang set counts when it held anything: a hang or more, or a lone hang's cut seconds. */
export const heldSet = (s: SetDone): boolean => (s.reps ?? 1) > 0 && (s.onS ?? 1) > 0;

/**
 * Each grip a hang session ran, indexed by item. The first reads against its saved protocol and
 * a later grip against its saved dose; a row saved without one reads the shape of its kept sets.
 * Each carries the rest the timer ran after it, where the row saved one.
 */
export function hangSessionItems({ gripId, protocol, done }: Logged): SessionItem[] {
  const last = Math.max(0, ...done.map((d) => d.item));
  return Array.from({ length: last + 1 }, (_, item): SessionItem => {
    const d = done.find((x) => x.item === item);
    const rest = d?.restAfterS === undefined ? {} : { restAfterS: d.restAfterS };
    if (item === 0) return { exercise: gripId, dose: protocolDose(protocol), ...rest };
    const [first] = d?.sets ?? [];
    if (d?.dose !== undefined) return { exercise: d.exercise, dose: d.dose, ...rest };
    if (d === undefined || first === undefined)
      return { exercise: d?.exercise ?? "", dose: { sets: 0 } };
    const { rpe: _r, climbs: _c, ...set } = first;
    const dose: Dose = {
      ...set,
      sets: d.sets.length,
      reps: Math.max(...d.sets.map((s) => s.reps ?? 1)),
    };
    return { exercise: d.exercise, dose, ...rest };
  });
}

/** How long a hang session ran: every grip's protocol, the first as saved, and each rest between grips it saved. */
export const hangSessionSeconds = (s: Logged): number =>
  hangSessionItems(s).reduce(
    (sum, { dose, restAfterS = 0 }, item) =>
      sum +
      restAfterS +
      (item === 0 ? totalSeconds(s.protocol) : totalSeconds(doseProtocol("", dose))),
    0
  );
