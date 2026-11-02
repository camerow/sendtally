import type { WeightUnit } from "@sendtally/core/hang";
import type { HangGrid } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import { loadText } from "./loadText";

/** "33 of 36 hangs · top load +10 lb", the load left off when every set hung bodyweight. */
export function hangCount({ held, total, loads }: HangGrid, unit: WeightUnit): string {
  const top = Math.max(...loads);
  return [
    t("summary.hangsOf", { held, total }),
    ...(loads.every((l) => l === 0) ? [] : [t("summary.topLoad", { load: loadText(top, unit) })]),
  ].join(" · ");
}
