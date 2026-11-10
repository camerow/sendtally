import React from "react";
import { View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { dayTitle } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import {
  dayEntries,
  loggedKind,
  type LoggedItem,
  type TrainingDay,
} from "@sendtally/features/training";
import { DashedPanel } from "../components/DashedPanel";
import { Label } from "../components/Label";
import { Title } from "../components/Title";
import { useHangData } from "../data/HangDataContext";
import { useLibrary } from "../library/useLibrary";
import { LoggedRow } from "./LoggedRow";
import { loggedRowText } from "./loggedRowText";
import { OccurrenceCard } from "./OccurrenceCard";
import { OccurrenceRow } from "./OccurrenceRow";
import { SkippedRow } from "./SkippedRow";
import { useDisplayScales } from "@sendtally/features/settings";

export type DaySectionProps = {
  day: TrainingDay;
  onOpen: (item: LoggedItem) => void;
  /** Off where the screen's hero already names the day. */
  heading?: boolean;
  /** As the week list shows a day: a date line but on Today, and an empty day as nothing more. */
  quiet?: boolean;
};

const loggedKey = (item: LoggedItem): string => {
  if (item.kind === "activity") return item.activity.id;
  return item.kind === "climb" ? item.session.fingerprint : item.session.id;
};

/** A day in plan order: each plan as it stands, a done one as the session that did it, then what else was logged. */
export function DaySection({
  day,
  onOpen,
  heading = true,
  quiet = false,
}: DaySectionProps): React.ReactElement {
  const { model } = useHangData();
  const scales = useDisplayScales();
  const library = useLibrary().state;
  const workout = (id: string) =>
    library.status === "ready" ? library.data.workout(id) : undefined;
  const empty = day.logged.length === 0 && day.plans.length === 0;
  const title = day.isToday ? t("training.today") : dayTitle(day.date);
  // The week list keeps display size for Today; every other day reads as a quiet date line.
  const head =
    quiet && !day.isToday ? (
      <View style={{ paddingTop: 12, marginBottom: -4 }}>
        <Label color={colors.textSecondary}>{title}</Label>
      </View>
    ) : (
      <View style={{ paddingTop: 4 }}>
        <Title size={26}>{title}</Title>
      </View>
    );
  if (empty && quiet) return head;
  return (
    <View style={{ gap: 12 }}>
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
              onPress={() => onOpen(item)}
            />
          );
        }
        const o = e.occurrence;
        const w = workout(o.membership.workoutId);
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
    </View>
  );
}
