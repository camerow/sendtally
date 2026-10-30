import { randomUUID } from "expo-crypto";
import { router } from "expo-router";
import React from "react";
import { View } from "react-native";
import { addDays, weekStart, type Block } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import { Button } from "../components/Button";
import { MonthCalendar } from "../components/MonthCalendar";
import { SheetHeader } from "../components/SheetHeader";
import { useHangData } from "../data/HangDataContext";
import { HangSheet } from "../data/HangSheet";
import { usePlanActions } from "../plan/usePlanActions";

export type PlanAgainSheetProps = { block: Block; onClose: () => void };

/** Plan a block again: only the week it starts asks; the copy opens once it is made. */
export function PlanAgainSheet({ block, onClose }: PlanAgainSheetProps): React.ReactElement {
  const { today } = useHangData();
  const actions = usePlanActions();
  const [start, setStart] = React.useState(weekStart(today));
  const [busy, setBusy] = React.useState(false);

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
          min={weekStart(today)}
          today={today}
          shaded={() => false}
          onPick={(d) => setStart(weekStart(d))}
        />
        <Button
          label={t("plan.planAgain")}
          onPress={() => void save()}
          disabled={busy}
          variant="primary"
          height={54}
        />
      </View>
    </HangSheet>
  );
}
