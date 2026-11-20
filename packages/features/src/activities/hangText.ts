import type { WeightUnit } from "@sendtally/core/hang";
import { t } from "../i18n";
import { hangLoadText } from "../hang/weights";
import type { HangTotals } from "./summary";

/** "33 of 36 hangs · top load +10 lb", the load left off when every set hung bodyweight. */
export function hangCount({ held, total, loads }: HangTotals, unit: WeightUnit): string {
  const top = Math.max(...loads);
  return [
    t("summary.hangsOf", { held, total }),
    ...(loads.every((l) => l === 0)
      ? []
      : [t("summary.topLoad", { load: hangLoadText(top, unit) })]),
  ].join(" · ");
}
