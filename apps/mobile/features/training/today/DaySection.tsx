import React from "react";
import { View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { dayTitle } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { loggedKind, type LoggedItem, type TrainingDay } from "@sendtally/features/training";
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

/** The selected day: what is planned on it, missed or still to come, then what was done under Done. */
export function DaySection({
  day,
  onOpen,
  heading = true,
  quiet = false,
}: DaySectionProps): React.ReactElement {
  const { model } = useHangData();
  const library = useLibrary().state;
  const workout = (id: string) =>
    library.status === "ready" ? library.data.workout(id) : undefined;
  const empty = day.logged.length === 0 && day.plans.length === 0;
  const title = day.isToday ? t("training.today") : dayTitle(day.date);
  // The week list keeps display size for Today; every other day reads as a quiet date line.
  const head =
    quiet && !day.isToday ? (
      <View style={{ minHeight: 44, justifyContent: "center" }}>
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
      {day.plans.map((o) => {
        const w = workout(o.membership.workoutId);
        if (w === undefined || o.status === "done" || o.status === "moved") return null;
        if (o.status === "skipped")
          return <SkippedRow key={o.membership.id} occurrence={o} workout={w} />;
        return day.isToday && o.status === "planned" ? (
          <OccurrenceCard key={o.membership.id} occurrence={o} workout={w} />
        ) : (
          <OccurrenceRow key={o.membership.id} occurrence={o} workout={w} />
        );
      })}
      {day.logged.length > 0 && (
        <Label color={colors.textSecondary} style={{ paddingTop: 4 }}>
          {t("plan.done")}
        </Label>
      )}
      {day.logged.map((item) => (
        <LoggedRow
          key={loggedKey(item)}
          kind={loggedKind(item)}
          text={loggedRowText(item, model)}
          onPress={() => onOpen(item)}
        />
      ))}
      {empty && (
        <DashedPanel
          title={t("hang.restDay")}
          body={day.isPast ? t("hang.restDayPast") : t("hang.restDayFuture")}
        />
      )}
    </View>
  );
}
