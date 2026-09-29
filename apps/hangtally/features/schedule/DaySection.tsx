import React from "react";
import { View } from "react-native";
import type { Schedule } from "@sendtally/core/hang";
import { dayTitle } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { Button } from "../../components/Button";
import { DashedPanel } from "../../components/DashedPanel";
import { Label } from "../../components/Label";
import { Title } from "../../components/Title";
import { useTheme } from "../../theme/ThemeContext";
import { LoggedRow } from "./LoggedRow";
import { PendingRow } from "./PendingRow";
import type { ScheduleDay } from "./scheduleDay";
import { UpTodayCard } from "./UpTodayCard";

export type DaySectionProps = {
  day: ScheduleDay;
  onOpenSession: (id: string) => void;
  onEditSchedule: (s: Schedule) => void;
  onStart: (s: Schedule) => void;
  onSkip: (s: Schedule) => void;
  onAdd: () => void;
};

export function DaySection({
  day,
  onOpenSession,
  onEditSchedule,
  onStart,
  onSkip,
  onAdd,
}: DaySectionProps): React.ReactElement {
  const c = useTheme();
  const count = day.logged.length + day.pending.length;
  return (
    <>
      <View
        style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" }}
      >
        <Title size={26} color={c.onDark}>
          {day.isToday ? t("hang.today") : dayTitle(day.date)}
        </Title>
        <Label color={c.onDark3}>
          {day.isPast
            ? t("hang.loggedCount", { n: day.logged.length })
            : t("hang.plannedCount", { n: count })}
        </Label>
      </View>
      {day.logged.length > 0 && (
        <View style={{ gap: 8 }}>
          {day.logged.map((s) => (
            <LoggedRow key={s.id} session={s} onPress={() => onOpenSession(s.id)} />
          ))}
        </View>
      )}
      {day.pending.map((s) =>
        day.isToday ? (
          <UpTodayCard
            key={s.id}
            schedule={s}
            onEdit={() => onEditSchedule(s)}
            onStart={() => onStart(s)}
          />
        ) : (
          <PendingRow
            key={s.id}
            schedule={s}
            date={day.date}
            missed={day.isPast}
            onOpen={() => onEditSchedule(s)}
            onSkip={() => onSkip(s)}
          />
        )
      )}
      {count === 0 && (
        <DashedPanel
          title={t("hang.restDay")}
          body={day.isPast ? t("hang.restDayPast") : t("hang.restDayFuture")}
        />
      )}
      <Button
        label={t("hang.addToSchedule")}
        onPress={onAdd}
        variant="dashed"
        height={52}
        icon="plus"
      />
    </>
  );
}
