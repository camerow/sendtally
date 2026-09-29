import type { HangSessionRecord } from "@sendtally/api-client";
import { loadLabel, shortDate, type HangModel } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";

export type SessionText = {
  name: string;
  grip: string;
  load: string;
  completion: string;
  rpe: string;
  date: string;
};

/** A logged session, named by its workout today and loaded as it was run. */
export function sessionText(s: HangSessionRecord, model: HangModel): SessionText {
  return {
    name: model.workout(s.workoutId)?.name ?? s.protocol.name,
    grip: model.gripName(s.gripId),
    load: loadLabel(s.protocol.kind, s.loadKg, model.settings.units),
    completion: s.pct >= 100 ? t("hang.completeLower") : t("hang.percentComplete", { pct: s.pct }),
    rpe: t("hang.rpeValue", { value: s.rpe ?? "–" }),
    date: shortDate(s.date),
  };
}
