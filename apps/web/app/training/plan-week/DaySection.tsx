import React from "react";
import { dayTitle } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import {
  dayEntries,
  loggedKind,
  loggedRowText,
  type TrainingDay,
  loggedKey,
} from "@sendtally/features/training";
import { useDisplayScales } from "@sendtally/features/settings";
import { DashedPanel } from "../components/DashedPanel";
import { useHangData } from "../data/HangDataContext";
import { useLibrary, workoutIn } from "../library/useLibrary";
import { LoggedRow } from "./LoggedRow";
import { OccurrenceCard } from "./OccurrenceCard";
import { OccurrenceRow } from "./OccurrenceRow";
import { loggedPath } from "./planLinks";
import { SkippedRow } from "./SkippedRow";

/**
 * A day in plan order, as the week list shows it: each plan as it stands, a done one as what
 * did it, then what else was logged. Today is a title; any other day a quiet date line, and
 * an empty one nothing more.
 */
export function DaySection({
  day,
  heading = true,
}: {
  day: TrainingDay;
  /** Off where the page's own title already names the day. */
  heading?: boolean;
}): React.ReactElement {
  const { model } = useHangData();
  const scales = useDisplayScales();
  const workoutOf = workoutIn(useLibrary());
  const empty = day.logged.length === 0 && day.plans.length === 0;
  const head = day.isToday ? (
    <h2 className="plan-day-title">{t("training.today")}</h2>
  ) : (
    <h2 className="plan-label plan-label--muted plan-day-line">{dayTitle(day.date)}</h2>
  );
  if (heading && empty && !day.isToday) return head;
  return (
    <div className="plan-day">
      {heading && head}
      {dayEntries(day).map((e) => {
        if (e.kind !== "plan") {
          const { item } = e;
          return (
            <LoggedRow
              key={
                e.kind === "done"
                  ? `${e.occurrence.membership.id}:${loggedKey(item)}`
                  : loggedKey(item)
              }
              kind={loggedKind(item)}
              text={loggedRowText(item, model, scales)}
              to={loggedPath(item)}
            />
          );
        }
        const o = e.occurrence;
        const w = workoutOf(o.membership.workoutId);
        if (w === undefined) return null;
        if (o.status === "skipped")
          return <SkippedRow key={o.membership.id} occurrence={o} workout={w} />;
        return day.isToday && o.status === "planned" ? (
          <OccurrenceCard key={o.membership.id} occurrence={o} workout={w} />
        ) : (
          <OccurrenceRow key={o.membership.id} occurrence={o} workout={w} />
        );
      })}
      {empty && (
        <DashedPanel
          title={t("hang.restDay")}
          body={day.isPast ? t("hang.restDayPast") : t("hang.restDayFuture")}
        />
      )}
    </div>
  );
}
