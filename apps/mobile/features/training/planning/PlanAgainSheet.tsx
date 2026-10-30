import { randomUUID } from "expo-crypto";
import { router } from "expo-router";
import React from "react";
import { Text, View } from "react-native";
import { addDays, weekday, type Block } from "@sendtally/core/hang";
import { shortDate, weekdayLong } from "@sendtally/features/hang";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { blockMembers, useTrainingLog } from "@sendtally/features/training";
import { useApi } from "../../../lib/api";
import { Button } from "../components/Button";
import { MonthCalendar } from "../components/MonthCalendar";
import { SheetHeader } from "../components/SheetHeader";
import { useHangData } from "../data/HangDataContext";
import { HangSheet } from "../data/HangSheet";
import { usePlanActions } from "../plan/usePlanActions";
import { type } from "../type";

export type PlanAgainSheetProps = { block: Block; onClose: () => void };

/** Plan a block again, or schedule a template, from any day on: its weeks run from that weekday, and the copy opens once it is made. */
export function PlanAgainSheet({ block, onClose }: PlanAgainSheetProps): React.ReactElement {
  const { today } = useHangData();
  const actions = usePlanActions();
  const [start, setStart] = React.useState(today);
  const last = addDays(start, block.weeks * 7 - 1);
  const [busy, setBusy] = React.useState(false);
  const { log } = useTrainingLog(useApi());
  const dayless =
    block.start === null
      ? blockMembers(log.plan, block)
          .filter((m) => m.weekdays.length === 0)
          .flatMap((m) => log.workout(m.workoutId)?.name ?? [])
      : [];

  const save = async (): Promise<void> => {
    setBusy(true);
    const id = randomUUID();
    const made = await actions.copyBlock(block.id, id, start);
    setBusy(false);
    if (!made) return;
    onClose();
    router.replace({ pathname: "/plan/block/[id]", params: { id } });
  };

  return (
    <HangSheet visible onClose={onClose} closeLabel={t("common.cancel")}>
      <View style={{ gap: 20, paddingBottom: 12 }}>
        <SheetHeader
          kicker={block.name}
          title={t("plan.planAgainStart")}
          action={t("common.cancel")}
          onAction={onClose}
        />
        <MonthCalendar
          selected={start}
          picked={Array.from({ length: 7 }, (_, i) => addDays(start, i))}
          min={today}
          today={today}
          shaded={() => false}
          onPick={setStart}
        />
        <Text style={[type.body, { fontSize: 13, lineHeight: 19, color: colors.textSecondary }]}>
          {t("plan.startsRange", {
            start: shortDate(start),
            end: shortDate(last),
            from: weekdayLong(weekday(start)),
            to: weekdayLong(weekday(last)),
          })}
        </Text>
        {dayless.length > 0 && (
          <Text style={[type.body, { fontSize: 13, lineHeight: 19, color: colors.textSecondary }]}>
            {t("plan.noDaysYet", { count: dayless.length, workouts: dayless.join(", ") })}
          </Text>
        )}
        <Button
          label={t("plan.scheduleFrom", { day: shortDate(start) })}
          onPress={() => void save()}
          disabled={busy}
          variant="primary"
          height={54}
        />
      </View>
    </HangSheet>
  );
}
