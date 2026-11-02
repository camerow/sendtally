import type { HangSessionRecord } from "@sendtally/api-client";
import { setupLabel, type HangModel } from "@sendtally/features/hang";

export type SessionText = { name: string; grip: string; load: string };

/** A logged session, named by its workout today and loaded as it was run. */
export function sessionText(s: HangSessionRecord, model: HangModel): SessionText {
  return {
    name: model.workout(s.workoutId)?.name ?? s.protocol.name,
    grip: model.gripName(s.gripId),
    load: setupLabel(s.protocol.kind, s, model.settings.units),
  };
}
