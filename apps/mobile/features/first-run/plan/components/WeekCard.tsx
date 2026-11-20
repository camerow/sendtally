import React from "react";
import type { WorkoutKind } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import { DarkWeek } from "../../../../components/DarkWeek";
import { DarkCard } from "../../components/DarkCard";

export type WeekCardProps = {
  /** The days on, with the kinds of what lands on each; an empty list is a day on with no workout yet. */
  week: readonly (readonly WorkoutKind[] | null)[];
  /** The line beside the label once a day is on, and the prompt while none is. */
  meta: string;
  empty: string;
};

/** "Your week": seven days, lit where the user can train, with each workout's mark on its days. */
export function WeekCard({ week, meta, empty }: WeekCardProps): React.ReactElement {
  const any = week.some((d) => d !== null);
  return (
    <DarkCard label={t("plan.week")} {...(any ? { meta } : { note: empty })}>
      <DarkWeek week={week} />
    </DarkCard>
  );
}
