import React from "react";
import { View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { dayTitle } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import {
  dayMarks,
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

export type DaySectionProps = {
  day: TrainingDay;
  onOpen: (item: LoggedItem) => void;
};

const loggedKey = (item: LoggedItem): string => {
  if (item.kind === "activity") return item.activity.id;
  return item.kind === "climb" ? item.session.fingerprint : item.session.id;
};

function subtitle(day: TrainingDay): string {
  const marks = dayMarks(day);
  const logged = t("hang.loggedCount", { n: marks.filter((m) => m.filled).length });
  if (day.isPast) return logged;
  const open = marks.filter((m) => !m.filled).length;
  const planned = t("hang.plannedCount", { n: open });
  return open === marks.length ? planned : `${planned} · ${logged}`;
}

/** The selected day: what was logged, what is planned on it, done, missed or still to come. */
export function DaySection({ day, onOpen }: DaySectionProps): React.ReactElement {
  const { model } = useHangData();
  const library = useLibrary().state;
  const workout = (id: string) =>
    library.status === "ready" ? library.data.workout(id) : undefined;
  const empty = day.logged.length === 0 && day.plans.length === 0;
  return (
    <View style={{ gap: 12 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 12,
          paddingTop: 4,
        }}
      >
        <Title size={26}>{day.isToday ? t("training.today") : dayTitle(day.date)}</Title>
        <Label color={colors.textSecondary}>{subtitle(day)}</Label>
      </View>
      {day.logged.map((item) => (
        <LoggedRow
          key={loggedKey(item)}
          kind={loggedKind(item)}
          text={loggedRowText(item, model)}
          onPress={() => onOpen(item)}
        />
      ))}
      {day.plans.map((o) => {
        const w = workout(o.membership.workoutId);
        if (w === undefined) return null;
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
