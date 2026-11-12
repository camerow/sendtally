import React from "react";
import { Text, View } from "react-native";
import { weekday, type CalendarDate } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { dayMonth, weekdayLong } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { trainingDay, useTrainingLog, blockTag, blockOn } from "@sendtally/features/training";
import { ScreenFrame } from "../../../components/ScreenFrame";
import { Toast } from "../../../components/Toast";
import { useApi } from "../../../lib/api";
import { openBlock } from "../blocks/openBlock";
import { Button } from "../components/Button";
import { Label } from "../components/Label";
import { Title } from "../components/Title";
import { useHangData } from "../data/HangDataContext";
import { AddWorkoutsSheet, type Scheduled } from "../planning/AddWorkoutsSheet";
import { DaySection } from "../today/DaySection";
import { openLogged } from "../today/openLogged";
import { type } from "../type";

export type PlanDayScreenProps = { date: CalendarDate };

/** One day of the plan: what was logged on it, each workout planned and how it went, and a way to add another. */
export function PlanDayScreen({ date }: PlanDayScreenProps): React.ReactElement {
  const { today } = useHangData();
  const { log } = useTrainingLog(useApi());
  const day = trainingDay(log, date, today);
  const block = blockOn(log.plan.blocks, date);
  const kicker = block === null ? null : blockTag(block.name, block, date);
  const [adding, setAdding] = React.useState(false);
  const [scheduled, setScheduled] = React.useState<Scheduled | null>(null);
  return (
    <ScreenFrame
      overlay={
        scheduled !== null && (
          <Toast
            message={t("plan.scheduledName", { name: scheduled.name })}
            action={{ label: t("plan.viewTemplate"), onPress: () => openBlock(scheduled.id) }}
            onHide={() => setScheduled(null)}
          />
        )
      }
      footer={
        <Button
          label={t("plan.schedule")}
          onPress={() => setAdding(true)}
          variant="primary"
          height={54}
          icon="plus"
        />
      }
    >
      <View style={{ gap: 4 }}>
        {kicker !== null && <Label color={colors.gunmetal}>{kicker}</Label>}
        <Title size={34}>{weekdayLong(weekday(date))}</Title>
        <Text style={[type.mono, { fontSize: 12, color: colors.textSecondary }]}>
          {dayMonth(date)}
        </Text>
      </View>
      <DaySection day={day} onOpen={openLogged} heading={false} />
      <AddWorkoutsSheet
        flow={{ date, blockId: block?.id ?? null }}
        visible={adding}
        onClose={() => setAdding(false)}
        onScheduled={setScheduled}
      />
    </ScreenFrame>
  );
}
