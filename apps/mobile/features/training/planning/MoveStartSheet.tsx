import React from "react";
import { Text, View } from "react-native";
import { addDays, weekday, type DatedBlock } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { shortDate, weekdayLong } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { usePlan } from "@sendtally/features/training";
import { useApi } from "../../../lib/api";
import { Button } from "../components/Button";
import { MonthCalendar } from "../components/MonthCalendar";
import { SheetHeader } from "../components/SheetHeader";
import { useHangData } from "../data/HangDataContext";
import { HangSheet } from "../data/HangSheet";
import { usePlanActions } from "../plan/usePlanActions";
import { type } from "../type";

export type MoveStartSheetProps = { block: DatedBlock; onClose: () => void };

/** Moving a block that has not started to another first day, its plans moving with it. */
export function MoveStartSheet({ block, onClose }: MoveStartSheetProps): React.ReactElement {
  const { today } = useHangData();
  const plan = usePlan(useApi()).state;
  const actions = usePlanActions();
  const [start, setStart] = React.useState(block.start);
  const last = addDays(start, block.weeks * 7 - 1);

  const save = (): void => {
    void actions.saveBlock({ ...block, start });
    // Its plans start with it; their days are block weeks, so they move as they are.
    if (plan.status === "ready")
      plan.data.memberships
        .filter((m) => m.blockId === block.id && m.start === block.start)
        .forEach((m) => void actions.saveMembership({ ...m, start }));
    onClose();
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
          picked={[start]}
          min={today}
          today={today}
          shaded={(d) => d > start && d < addDays(start, 7)}
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
        <Button
          label={t("plan.startOn", { day: shortDate(start) })}
          onPress={save}
          disabled={start === block.start}
          variant="primary"
          height={54}
        />
      </View>
    </HangSheet>
  );
}
