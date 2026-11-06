import { randomUUID } from "expo-crypto";
import { router } from "expo-router";
import React from "react";
import { View } from "react-native";
import type { Block } from "@sendtally/core/hang";
import { shortDate } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { Button } from "../components/Button";
import { SheetHeader } from "../components/SheetHeader";
import { useHangData } from "../data/HangDataContext";
import { HangSheet } from "../data/HangSheet";
import { usePlanActions } from "../plan/usePlanActions";
import { PlanAgainStart } from "./PlanAgainStart";

export type PlanAgainSheetProps = {
  block: Block;
  /** What back says on the block it makes: where this block was opened from. */
  back?: string;
  onClose: () => void;
};

/** Plan a block again, or schedule a template, from any day on: its weeks run from that weekday, and the copy opens once it is made. */
export function PlanAgainSheet({ block, back, onClose }: PlanAgainSheetProps): React.ReactElement {
  const { today } = useHangData();
  const actions = usePlanActions();
  const [start, setStart] = React.useState(today);
  const [busy, setBusy] = React.useState(false);

  const save = async (): Promise<void> => {
    setBusy(true);
    const id = randomUUID();
    const made = await actions.copyBlock(block.id, id, start);
    setBusy(false);
    if (!made) return;
    onClose();
    router.replace({
      pathname: "/plan/block/[id]",
      params: back === undefined ? { id } : { id, back },
    });
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
        <PlanAgainStart block={block} start={start} onPick={setStart} />
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
