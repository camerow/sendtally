import React from "react";
import { t } from "@sendtally/features/i18n";
import { Icon } from "../../components/Icon";

export type WeekNavProps = { week: number; weeks: number; onPick: (week: number) => void };

/** A block week's title between arrows to the week before and after. */
export function WeekNav({ week, weeks, onPick }: WeekNavProps): React.ReactElement {
  const arrow = (icon: "back" | "forward", label: string, to: number): React.ReactElement => (
    <button
      type="button"
      className="week-strip-step week-nav-step"
      aria-label={label}
      disabled={to < 1 || to > weeks}
      onClick={() => onPick(to)}
    >
      <Icon name={icon} size={18} strokeWidth={2} />
    </button>
  );
  return (
    <div className="week-nav">
      {arrow("back", t("hang.previousWeek"), week - 1)}
      <span className="plan-label">{t("plan.weekNumber", { n: week })}</span>
      {arrow("forward", t("hang.nextWeek"), week + 1)}
    </div>
  );
}
