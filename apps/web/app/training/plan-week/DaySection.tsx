import React from "react";
import { dayTitle } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import {
  dayEntries,
  loggedKind,
  loggedRowText,
  type LoggedItem,
  type TrainingDay,
} from "@sendtally/features/training";
import { useDisplayScales } from "@sendtally/features/settings";
import { DashedPanel } from "../components/DashedPanel";
import { useHangData } from "../data/HangDataContext";
import { useLibrary } from "../library/useLibrary";
import { LoggedRow } from "./LoggedRow";
import { OccurrenceCard } from "./OccurrenceCard";
import { OccurrenceRow } from "./OccurrenceRow";
import { loggedPath } from "./planLinks";
import { SkippedRow } from "./SkippedRow";

const loggedKey = (item: LoggedItem): string => {
  if (item.kind === "activity") return item.activity.id;
  return item.kind === "climb" ? item.session.fingerprint : item.session.id;
};

/**
 * A day in plan order, as the week list shows it: each plan as it stands, a done one as what
 * did it, then what else was logged. Today is a title; any other day a quiet date line, and
 * an empty one nothing more.
 */
export function DaySection({ day }: { day: TrainingDay }): React.ReactElement {
  const { model } = useHangData();
  const scales = useDisplayScales();
  const library = useLibrary().state;
  const empty = day.logged.length === 0 && day.plans.length === 0;
  const head = day.isToday ? (
    <h2 className="plan-day-title">{t("training.today")}</h2>
  ) : (
    <h2 className="plan-label plan-label--muted plan-day-line">{dayTitle(day.date)}</h2>
  );
  if (empty && !day.isToday) return head;
  return (
    <div className="plan-day">
      {head}
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
        const w =
          library.status === "ready" ? library.data.workout(o.membership.workoutId) : undefined;
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
