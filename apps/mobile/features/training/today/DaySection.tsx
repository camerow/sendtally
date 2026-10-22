import React from "react";
import { View } from "react-native";
import type { Schedule } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { dayTitle } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import type { LoggedItem, TrainingDay } from "@sendtally/features/training";
import { Button } from "../components/Button";
import { DashedPanel } from "../components/DashedPanel";
import { Label } from "../components/Label";
import { Title } from "../components/Title";
import { useHangData } from "../data/HangDataContext";
import { LoggedRow } from "./LoggedRow";
import { loggedRowText } from "./loggedRowText";
import { PlannedRow } from "./PlannedRow";
import { UpTodayCard } from "./UpTodayCard";

export type DaySectionProps = {
  day: TrainingDay;
  onOpen: (item: LoggedItem) => void;
  onEditPlan: (schedule: Schedule) => void;
  onStart: (schedule: Schedule) => void;
  onSkip: (schedule: Schedule) => void;
  onAdd: () => void;
};

function subtitle(day: TrainingDay): string {
  const logged = t("hang.loggedCount", { n: day.logged.length });
  if (day.isPast) return logged;
  const planned = t("hang.plannedCount", { n: day.planned.length });
  return day.logged.length === 0 ? planned : `${planned} · ${logged}`;
}

/** The selected day: what was logged, what is still planned, and a way to plan more. */
export function DaySection({
  day,
  onOpen,
  onEditPlan,
  onStart,
  onSkip,
  onAdd,
}: DaySectionProps): React.ReactElement {
  const { model } = useHangData();
  const empty = day.logged.length === 0 && day.planned.length === 0;
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
          key={item.kind === "climb" ? item.session.fingerprint : item.session.id}
          kind={item.kind}
          text={loggedRowText(item, model)}
          onPress={() => onOpen(item)}
        />
      ))}
      {day.planned.map(({ schedule }) =>
        day.isToday ? (
          <UpTodayCard
            key={schedule.id}
            schedule={schedule}
            onEdit={() => onEditPlan(schedule)}
            onStart={() => onStart(schedule)}
          />
        ) : (
          <PlannedRow
            key={schedule.id}
            schedule={schedule}
            date={day.date}
            missed={day.isPast}
            onOpen={() => onEditPlan(schedule)}
            onSkip={() => onSkip(schedule)}
          />
        )
      )}
      {empty && (
        <DashedPanel
          title={t("hang.restDay")}
          body={day.isPast ? t("hang.restDayPast") : t("hang.restDayFuture")}
        />
      )}
      <Button
        label={t("training.addToPlan")}
        onPress={onAdd}
        variant="dashed"
        height={50}
        icon="plus"
      />
    </View>
  );
}
