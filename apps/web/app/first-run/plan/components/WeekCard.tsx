import React from "react";
import type { Weekday, WorkoutKind } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import { DarkWeek } from "../../../components/DarkWeek";
import { DarkCard } from "../../components/DarkCard";

export type WeekCardProps = {
  /** The days on, with the kinds of what lands on each; an empty list is a day on with no workout yet. */
  week: readonly (readonly WorkoutKind[] | null)[];
  /** The line beside the label once a day is on, and the prompt while none is. */
  meta: string;
  empty: string;
  /** Where days are being picked: the prompt's line keeps its height once a day is on, so nothing below moves. */
  steady?: boolean;
  /** Makes the seven days the buttons, as P1 uses them. */
  onToggle?: (day: Weekday) => void;
};

/** "Your week": seven days, lit where the user can train, with each workout's mark on its days. */
export function WeekCard({
  week,
  meta,
  empty,
  steady = false,
  onToggle,
}: WeekCardProps): React.ReactElement {
  const any = week.some((d) => d !== null);
  return (
    <DarkCard
      label={t("plan.week")}
      meta={any ? meta : undefined}
      note={any && !steady ? undefined : empty}
      noteShown={!any}
    >
      <DarkWeek week={week} {...(onToggle === undefined ? {} : { onToggle })} />
    </DarkCard>
  );
}
