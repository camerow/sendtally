import React from "react";
import { Link } from "react-router";
import { t } from "@sendtally/features/i18n";
import { Icon } from "../../components/Icon";
import { SectionHeading } from "../../components/detail/SectionHeading";
import { workoutPath } from "../library/useLibrary";

/** The workouts that use an exercise, each opening its page. Left out when none does. */
export function UsedIn({
  workouts,
}: {
  workouts: readonly { id: string; name: string }[];
}): React.ReactElement | null {
  if (workouts.length === 0) return null;
  return (
    <section className="detail-section">
      <SectionHeading title={t("workouts.usedIn")} />
      {workouts.map((w) => (
        <Link key={w.id} to={workoutPath(w.id)} className="link-row">
          {w.name}
          <Icon name="chevron" size={18} />
        </Link>
      ))}
    </section>
  );
}
