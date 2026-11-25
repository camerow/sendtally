import React from "react";
import type { WorkoutKind } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import { DarkWeek } from "../../../../components/DarkWeek";
import { DarkCard } from "../../components/DarkCard";

export type WeekCardProps = {
  /** The days on, with the kinds of what lands on each. */
  week: readonly (readonly WorkoutKind[] | null)[];
  /** The line beside the label once a day is on. */
  meta: string;
  /** The line beside the label while no day is on. */
  empty: string;
};

/** "Your week": seven days, lit where training lands, with each workout's mark on its days. */
export function WeekCard({ week, meta, empty }: WeekCardProps): React.ReactElement {
  return (
    <DarkCard label={t("plan.week")} meta={week.some((d) => d !== null) ? meta : empty}>
      <DarkWeek week={week} />
    </DarkCard>
  );
}
