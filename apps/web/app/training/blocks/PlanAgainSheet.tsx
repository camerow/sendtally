import React from "react";
import { useNavigate } from "react-router";
import type { Block } from "@sendtally/core/hang";
import { shortDate } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { Sheet } from "../../components/Sheet";
import { useHangData } from "../data/HangDataContext";
import { usePlanActions } from "../data/usePlanActions";
import { PlanAgainStart } from "./PlanAgainStart";
import { blockPath } from "./paths";

export type PlanAgainSheetProps = { block: Block; onClose: () => void };

/** Plan a block again, or schedule a template, from any day on: its weeks run from that weekday, and the copy opens once it is made. */
export function PlanAgainSheet({ block, onClose }: PlanAgainSheetProps): React.ReactElement {
  const { today } = useHangData();
  const actions = usePlanActions();
  const navigate = useNavigate();
  const [start, setStart] = React.useState(today);
  const [busy, setBusy] = React.useState(false);

  const save = async (): Promise<void> => {
    setBusy(true);
    const id = crypto.randomUUID();
    const made = await actions.copyBlock(block.id, id, start);
    setBusy(false);
    if (!made) return;
    onClose();
    void navigate(blockPath(id), { replace: true });
  };

  return (
    <Sheet
      open
      kicker={block.name || t("plan.untitled")}
      title={t("plan.planAgainStart")}
      onClose={onClose}
      action={{
        label: t("plan.scheduleFrom", { day: shortDate(start) }),
        disabled: busy,
        onPress: () => void save(),
      }}
    >
      <PlanAgainStart block={block} start={start} onPick={setStart} />
    </Sheet>
  );
}
