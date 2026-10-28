import React from "react";
import { View } from "react-native";
import type { CalendarDate } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { dayTitle } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { trainingDay, useTrainingLog } from "@sendtally/features/training";
import { BackButton } from "../../../components/BackButton";
import { useApi } from "../../../lib/api";
import { blockTag } from "../blocks/blockText";
import { Button } from "../components/Button";
import { DashedPanel } from "../components/DashedPanel";
import { Label } from "../components/Label";
import { Title } from "../components/Title";
import { useHangData } from "../data/HangDataContext";
import { useLibrary } from "../library/useLibrary";
import { AddKindSheet } from "../planning/AddKindSheet";
import { blockOn } from "./calendarGrid";
import { DayPlanRow } from "./DayPlanRow";

export type PlanDayScreenProps = { date: CalendarDate };

/** One day of the plan: each workout on it and how it went, and a way to add another. */
export function PlanDayScreen({ date }: PlanDayScreenProps): React.ReactElement {
  const { today } = useHangData();
  const { log } = useTrainingLog(useApi());
  const library = useLibrary().state;
  const workout = (id: string) =>
    library.status === "ready" ? library.data.workout(id) : undefined;
  const day = trainingDay(log, date, today);
  const block = blockOn(log.plan.blocks, date);
  const kicker = block === null ? null : blockTag(block.name, block, date);
  const [adding, setAdding] = React.useState(false);
  return (
    <View style={{ gap: 16 }}>
      <BackButton />
      <View style={{ gap: 6 }}>
        {kicker !== null && <Label color={colors.textSecondary}>{kicker}</Label>}
        <Title size={32}>{day.isToday ? t("training.today") : dayTitle(date)}</Title>
      </View>
      {day.plans.map((o) => {
        const w = workout(o.membership.workoutId);
        return w === undefined ? null : (
          <DayPlanRow key={o.membership.id} occurrence={o} workout={w} today={day.isToday} />
        );
      })}
      {day.plans.length === 0 && <DashedPanel body={t("calendar.nothingPlanned")} />}
      <Button
        label={t("calendar.addOnDay")}
        onPress={() => setAdding(true)}
        variant="dashed"
        icon="plus"
      />
      <AddKindSheet
        flow={{ date, blockId: block?.id ?? null }}
        visible={adding}
        onClose={() => setAdding(false)}
      />
    </View>
  );
}
