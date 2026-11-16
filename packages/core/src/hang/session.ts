import { doseProtocol, protocolDose, type Dose, type SessionItem } from "./plan";
import { totalSeconds } from "./protocol";
import type { HangSession } from "./types";

type Logged = Pick<HangSession, "gripId" | "protocol" | "done">;

/**
 * Each grip a hang session ran, indexed by item. The first reads against its saved protocol;
 * a later grip's prescription is not stored, so it reads against the shape of its own kept sets.
 */
export function hangSessionItems({ gripId, protocol, done }: Logged): SessionItem[] {
  const last = Math.max(0, ...done.map((d) => d.item));
  return Array.from({ length: last + 1 }, (_, item): SessionItem => {
    if (item === 0) return { exercise: gripId, dose: protocolDose(protocol) };
    const d = done.find((x) => x.item === item);
    const [first] = d?.sets ?? [];
    if (d === undefined || first === undefined)
      return { exercise: d?.exercise ?? "", dose: { sets: 0 } };
    const { rpe: _r, climbs: _c, ...set } = first;
    const dose: Dose = {
      ...set,
      sets: d.sets.length,
      reps: Math.max(...d.sets.map((s) => s.reps ?? 1)),
    };
    return { exercise: d.exercise, dose };
  });
}

/** How long a hang session ran: every grip's protocol, the first as saved, the rest as kept. */
export const hangSessionSeconds = (s: Logged): number =>
  hangSessionItems(s)
    .slice(1)
    .reduce(
      (sum, { dose }) => sum + totalSeconds(doseProtocol("", dose)),
      totalSeconds(s.protocol)
    );
